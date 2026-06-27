// Cron-воркер напоминаний об оплате. Запускается по расписанию (Cloudflare
// Cron Trigger), читает те же данные из KV (binding DATA), что и сайт, и шлёт
// через бота:
//   • арендатору — мягкое напоминание за 2 дня / за 1 день / сегодня
//     (только если у него привязан Telegram — иначе бот не может написать);
//   • владельцу (TELEGRAM_CHAT_ID) — в день оплаты: имя + сумма.
//
// Деплой: wrangler deploy --config workers/reminders/wrangler.jsonc
// Секреты: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, CRON_KEY (для ручного теста).

const DAY = 86400000;

function mskDayNum(d = new Date()) {
  const [y, m, dd] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .split("-")
    .map(Number);
  return Math.floor(Date.UTC(y, m - 1, dd) / DAY);
}

function isoToDayNum(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY);
}

const rub = new Intl.NumberFormat("ru-RU");
const money = (n) => `${rub.format(n)} ₽`;

// Реквизиты для оплаты (показываются в напоминании в день оплаты).
const PAYMENT_CARD = "5536913902973763";
const PAYMENT_PHONE = "+79522154104"; // СБП по номеру телефона

function effectiveWeekly(t) {
  return t.weekly + (t.positions ?? []).reduce((s, p) => s + (p.weekly || 0), 0);
}

function accrualStart(t, today) {
  const start = isoToDayNum(t.startDate);
  const done = t.pausedDays ?? 0;
  const ongoing = t.pausedSince ? Math.max(0, today - isoToDayNum(t.pausedSince)) : 0;
  return start + done + ongoing;
}

async function tg(token, chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Мягкие тексты для арендатора (за день / в день).
function tenantMessage(name, amount, days) {
  const first = String(name).split(" ")[0] || name;
  if (days === 1)
    return `Привет, ${first}! Завтра оплата за аренду — ${money(amount)}. Спасибо, что с нами!`;
  return `Привет, ${first}! Напоминаю про оплату на сегодня — ${money(amount)}.\n💳 Карта: <code>${PAYMENT_CARD}</code>\n📱 СБП: <code>${PAYMENT_PHONE}</code>\nЕсли уже внёс — не обращай внимания 👍`;
}

async function runReminders(env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const owner = env.TELEGRAM_CHAT_ID;
  if (!token) return { error: "no token" };

  const tenants = (await env.DATA.get("bot/tenants", "json")) ?? [];
  const paymentsRaw = (await env.DATA.get("bot/payments", "json")) ?? {};
  const users = (await env.DATA.get("auth/users", "json")) ?? {};
  // username -> chat_id, заполняется при /start (см. webhook бота).
  const tgChats = (await env.DATA.get("bot/tg-chats", "json")) ?? {};

  // tenantId -> telegram chat_id (из привязанных аккаунтов). auth/users —
  // объект {userId: User}.
  const chatByTenant = {};
  for (const u of Object.values(users || {})) {
    if (u?.tenantId && u?.telegramId) chatByTenant[u.tenantId] = u.telegramId;
  }
  const chatFor = (t) =>
    chatByTenant[t.id] ??
    (t.telegramUsername ? tgChats[String(t.telegramUsername).toLowerCase()] : undefined);

  const today = mskDayNum();
  const dueToday = []; // для дайджеста владельцу
  let sentTenant = 0;

  for (const t of tenants) {
    if (!t || !t.startDate) continue;
    if (t.pausedSince) continue; // на паузе — без напоминаний
    const paid = paymentsRaw[t.id]?.paidThrough ?? 0;
    if (t.buyoutWeeks && paid >= t.buyoutWeeks) continue; // выкуп завершён

    const start = accrualStart(t, today);
    const nextDueNum = start + paid * 7; // ближайший неоплаченный платёж
    const days = nextDueNum - today;
    if (days < 0 || days > 1) continue;

    const amount = effectiveWeekly(t);

    // Арендатору (если привязан Telegram).
    const chat = chatFor(t);
    if (chat) {
      const ok = await tg(token, chat, tenantMessage(t.name, amount, days));
      if (ok) sentTenant++;
    }

    // Владельцу — только в день оплаты.
    if (days === 0) dueToday.push({ name: t.name, amount });
  }

  // Дайджест владельцу за сегодня.
  if (owner && dueToday.length) {
    const lines = dueToday
      .sort((a, b) => b.amount - a.amount)
      .map((d) => `• ${d.name} — ${money(d.amount)}`);
    const total = dueToday.reduce((s, d) => s + d.amount, 0);
    await tg(
      token,
      owner,
      `💰 <b>Сегодня платят (${dueToday.length})</b>\n${lines.join("\n")}\n\nИтого: ${money(total)}`,
    );
  }

  return { ok: true, today, dueToday: dueToday.length, sentTenant };
}

export default {
  async scheduled(_event, env, _ctx) {
    await runReminders(env);
  },
  // Ручной запуск для теста: GET /?key=CRON_KEY
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!env.CRON_KEY || url.searchParams.get("key") !== env.CRON_KEY) {
      return new Response("forbidden", { status: 403 });
    }
    const r = await runReminders(env);
    return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
  },
};
