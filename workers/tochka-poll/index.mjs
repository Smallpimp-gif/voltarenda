// Cron-воркер: опрашивает статусы платежей Точки и подтверждает оплаты аренды.
// Читает bot/tochka-pending; для каждой ожидающей оплаты дёргает статус в Точке;
// как только APPROVED — отмечает оплату (paidThrough += период, запись в кассу
// kind=weekly), помечает pending как done и шлёт владельцам отчёт в бота.
// Всё исходящее (опрос), поэтому обходит блокировку входящих на проде.
//
// Деплой: wrangler deploy --config workers/tochka-poll/wrangler.jsonc
// Секреты: TOCHKA_JWT_TOKEN, TELEGRAM_BOT_TOKEN, CRON_KEY (ручной тест).

const BASE = "https://enter.tochka.com/uapi";
const rub = new Intl.NumberFormat("ru-RU");
const money = (n) => `${rub.format(n)} ₽`;

async function tochkaStatus(token, operationId) {
  try {
    const res = await fetch(
      `${BASE}/acquiring/v1.0/payments/${encodeURIComponent(operationId)}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const d = j?.Data;
    if (!d) return null;
    const op = Array.isArray(d.Operation) ? d.Operation[0] : d;
    return op?.status ?? op?.state ?? null;
  } catch {
    return null;
  }
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

async function runPoll(env) {
  const tochkaToken = env.TOCHKA_JWT_TOKEN;
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!tochkaToken || !botToken) return { error: "no token" };

  const pending = (await env.DATA.get("bot/tochka-pending", "json")) ?? { items: [] };
  const items = pending.items ?? [];
  const active = items.filter((x) => x.status === "pending");
  if (!active.length) return { ok: true, checked: 0, paid: 0 };

  const payments = (await env.DATA.get("bot/payments", "json")) ?? {};
  const ledger = (await env.DATA.get("bot/ledger", "json")) ?? { entries: [], lastResetAt: null };
  ledger.entries = ledger.entries ?? [];

  // Владельцы для отчёта (как в воркере напоминаний).
  const tgChats = (await env.DATA.get("bot/tg-chats", "json")) ?? {};
  const admins = new Set();
  const addAdmin = (v) => { const s = String(v ?? "").trim(); if (s) admins.add(s); };
  addAdmin(env.TELEGRAM_CHAT_ID);
  (env.OWNER_TELEGRAM_IDS || "").split(",").forEach(addAdmin);
  (env.OWNER_TELEGRAM_USERNAMES || "")
    .split(",")
    .map((u) => u.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean)
    .forEach((u) => addAdmin(tgChats[u]));

  let changed = false;
  let paidCount = 0;
  for (const p of active) {
    const status = await tochkaStatus(tochkaToken, p.operationId);
    if (status !== "APPROVED") continue;

    // Отметить оплату: закрыть период и записать в кассу.
    const rec = payments[p.tenantId] ?? { paidThrough: 0, partialPaid: 0 };
    rec.paidThrough = (rec.paidThrough ?? 0) + (p.weeks || 1);
    rec.partialPaid = 0;
    payments[p.tenantId] = rec;

    ledger.entries.push({
      id: crypto.randomUUID(),
      tenantId: p.tenantId,
      name: p.name,
      amount: p.amount,
      weeks: p.weeks || 1,
      kind: "weekly",
      at: new Date().toISOString(),
    });

    p.status = "done";
    changed = true;
    paidCount++;

    const text = `✅ <b>${p.name}</b> оплатил аренду — ${money(p.amount)} (через сайт)`;
    for (const chat of admins) await tg(botToken, chat, text);
  }

  if (changed) {
    await env.DATA.put("bot/payments", JSON.stringify(payments));
    await env.DATA.put("bot/ledger", JSON.stringify(ledger));
    await env.DATA.put("bot/tochka-pending", JSON.stringify({ items }));
  }
  return { ok: true, checked: active.length, paid: paidCount };
}

export default {
  async scheduled(_event, env, _ctx) {
    await runPoll(env);
  },
  // Ручной запуск для теста: GET /?key=CRON_KEY
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!env.CRON_KEY || url.searchParams.get("key") !== env.CRON_KEY) {
      return new Response("forbidden", { status: 403 });
    }
    const r = await runPoll(env);
    return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
  },
};
