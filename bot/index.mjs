// Бот напоминаний об оплате — Вольтаренда.
//
// Запуск:  npm run bot   (или node bot/index.mjs)
// Держать живым на сервере: pm2 / systemd — см. bot/README.md.
//
// Архитектура: long polling — бот сам опрашивает Telegram (исходящее
// соединение; именно оно работает с РФ-хостинга, в отличие от входящего
// webhook, который режется фильтром). Раз в день по расписанию шлёт
// напоминания.
//
// Тот же бот @Voltarenda, что и в lib/notify.ts: getUpdates (здесь) и
// sendMessage (там) на одном токене не конфликтуют. Webhook не ставим.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Bot, InlineKeyboard } from "grammy";
import cron from "node-cron";
import {
  loadTenants, loadSubscribers, saveSubscribers, upsertSubscriber,
  loadSentLog, saveSentLog,
} from "./lib/storage.mjs";
import { mskDayNum, nextDue, formatDay, computeDueReminders } from "./lib/schedule.mjs";
import * as msg from "./lib/messages.mjs";

// Лёгкая загрузка .env (без зависимостей). В проде переменные обычно
// даёт systemd/pm2 — тогда файла нет, и это ок. Уже заданные не трогаем.
function loadDotenv() {
  const path = fileURLToPath(new URL("../.env", import.meta.url));
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadDotenv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null;
const REMINDER_CRON = process.env.BOT_REMINDER_CRON || "0 10 * * *"; // 10:00
const TZ = process.env.BOT_TZ || "Europe/Moscow";

if (!TOKEN) {
  console.error("Нет TELEGRAM_BOT_TOKEN в окружении (.env). Останов.");
  process.exit(1);
}
if (!ADMIN_CHAT_ID) {
  console.warn("⚠ TELEGRAM_CHAT_ID не задан — команды оператора и привязка кнопками отключены. Напиши боту /id, чтобы узнать свой chat_id, и впиши его в .env.");
}

const bot = new Bot(TOKEN);
const tenants = loadTenants();
const tenantById = new Map(tenants.map((t) => [t.id, t]));

const isAdmin = (ctx) => ADMIN_CHAT_ID != null && ctx.chat?.id === ADMIN_CHAT_ID;

function tenantByUsername(username) {
  if (!username) return null;
  const u = username.replace(/^@/, "").toLowerCase();
  return tenants.find(
    (t) => (t.telegramUsername || "").replace(/^@/, "").toLowerCase() === u && u !== "",
  ) || null;
}

// Клавиатура выбора арендатора для оператора. callback: lnk:<chatId>:<tenantId>
function tenantPickKeyboard(chatId) {
  const kb = new InlineKeyboard();
  const linkedIds = new Set(
    Object.values(loadSubscribers()).filter((s) => s.tenantId).map((s) => s.tenantId),
  );
  for (const t of tenants) {
    const mark = linkedIds.has(t.id) ? "• " : "";
    kb.text(`${mark}${t.name}`, `lnk:${chatId}:${t.id}`).row();
  }
  kb.text("✖ Не арендатор", `lnk:${chatId}:_skip`);
  return kb;
}

function linkChatToTenant(chatId, tenantId) {
  const subs = loadSubscribers();
  const sub = subs[String(chatId)];
  if (!sub) return null;
  sub.tenantId = tenantId;
  sub.status = "active";
  sub.linkedAt = new Date().toISOString();
  saveSubscribers(subs);
  return sub;
}

// --- /start ----------------------------------------------------------
bot.command("start", async (ctx) => {
  const subs = loadSubscribers();
  const sub = upsertSubscriber(subs, {
    chatId: ctx.chat.id,
    username: ctx.from?.username,
    firstName: ctx.from?.first_name,
  });
  saveSubscribers(subs);

  const today = mskDayNum();

  if (sub.tenantId && tenantById.has(sub.tenantId)) {
    return ctx.reply(msg.welcomeAlreadyLinked(tenantById.get(sub.tenantId), today), { parse_mode: "HTML" });
  }

  // Авто-привязка, если оператор заранее вписал username в tenants.json.
  const match = tenantByUsername(sub.username);
  if (match) {
    linkChatToTenant(ctx.chat.id, match.id);
    if (ADMIN_CHAT_ID) {
      await bot.api.sendMessage(ADMIN_CHAT_ID, msg.adminLinked(sub, match), { parse_mode: "HTML" }).catch(() => {});
    }
    return ctx.reply(msg.linkedConfirm(match), { parse_mode: "HTML" });
  }

  // Иначе — просим оператора подтвердить кнопкой.
  await ctx.reply(msg.welcomeUnlinked(), { parse_mode: "HTML" });
  if (ADMIN_CHAT_ID) {
    await bot.api.sendMessage(ADMIN_CHAT_ID, msg.adminNewUser(sub), {
      parse_mode: "HTML",
      reply_markup: tenantPickKeyboard(ctx.chat.id),
    }).catch((e) => console.error("[start] не уведомил оператора:", e.message));
  }
});

// --- Привязка по кнопке (только оператор) ----------------------------
bot.callbackQuery(/^lnk:(-?\d+):(.+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCallbackQuery({ text: "Только для оператора" });
  const chatId = Number(ctx.match[1]);
  const tenantId = ctx.match[2];

  if (tenantId === "_skip") {
    await ctx.answerCallbackQuery({ text: "Отмечено: не арендатор" });
    return ctx.editMessageText(`${ctx.msg.text}\n\n— отмечено как «не арендатор».`);
  }

  const tenant = tenantById.get(tenantId);
  if (!tenant) return ctx.answerCallbackQuery({ text: "Нет такого арендатора" });

  const sub = linkChatToTenant(chatId, tenantId);
  if (!sub) return ctx.answerCallbackQuery({ text: "Пользователь не найден" });

  await ctx.answerCallbackQuery({ text: `Привязано: ${tenant.name}` });
  await ctx.editMessageText(msg.adminLinked(sub, tenant), { parse_mode: "HTML" });
  await bot.api.sendMessage(chatId, msg.linkedConfirm(tenant), { parse_mode: "HTML" }).catch(() => {});
});

// --- /status (арендатор) ---------------------------------------------
bot.command("status", async (ctx) => {
  const sub = loadSubscribers()[String(ctx.chat.id)];
  if (!sub?.tenantId || !tenantById.has(sub.tenantId)) {
    return ctx.reply("Ты пока не подключён. Нажми /start и дождись подтверждения оператора.");
  }
  return ctx.reply(msg.statusText(tenantById.get(sub.tenantId), mskDayNum()), { parse_mode: "HTML" });
});

// --- /stop /resume ---------------------------------------------------
bot.command("stop", (ctx) => {
  const subs = loadSubscribers();
  if (subs[String(ctx.chat.id)]) { subs[String(ctx.chat.id)].status = "stopped"; saveSubscribers(subs); }
  return ctx.reply("🔕 Напоминания выключены. /resume — включить снова.");
});
bot.command("resume", (ctx) => {
  const subs = loadSubscribers();
  if (subs[String(ctx.chat.id)]) { subs[String(ctx.chat.id)].status = "active"; saveSubscribers(subs); }
  return ctx.reply("🔔 Напоминания включены. /status — ближайший платёж.");
});

// --- /id — узнать свой chat_id (для настройки оператора) --------------
bot.command("id", (ctx) => ctx.reply(`chat_id: ${ctx.chat.id}`));

// --- /list (оператор): кто подключён и ближайшие платежи -------------
bot.command("list", (ctx) => {
  if (!isAdmin(ctx)) return;
  const subs = loadSubscribers();
  const today = mskDayNum();
  const linkedBy = new Map();
  for (const s of Object.values(subs)) if (s.tenantId) linkedBy.set(s.tenantId, s);

  const lines = ["<b>Арендаторы</b>", ""];
  for (const t of tenants) {
    const s = linkedBy.get(t.id);
    const who = s ? (s.username ? `@${s.username}` : s.firstName || s.chatId) : "—";
    const nd = nextDue(t, today);
    const due = nd.completed ? "выкуплено" : formatDay(nd.dueNum);
    const status = s ? (s.status === "active" ? "🔔" : "🔕") : "⚪";
    lines.push(`${status} ${msg.esc(t.name)} — ${due} · ${msg.esc(String(who))}`);
  }
  lines.push("", "⚪ не подключён · 🔔 активен · 🔕 пауза");
  return ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
});

// --- /sendnow (оператор): прогнать рассылку сейчас (тест) -------------
bot.command("sendnow", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const n = await runReminders();
  return ctx.reply(`Отправлено напоминаний: ${n}`);
});

// прочие сообщения — мягкий ответ
bot.on("message", (ctx) =>
  ctx.reply("Я бот напоминаний об оплате. /status — ближайший платёж, /start — подключиться."));

bot.catch((err) => console.error("[bot] ошибка:", err));

// --- Рассылка напоминаний -------------------------------------------
async function runReminders() {
  const subs = loadSubscribers();
  const today = mskDayNum();
  const due = computeDueReminders(tenants, subs, today);
  const log = loadSentLog();
  const sent = new Set(log.keys);
  let count = 0;
  let subsChanged = false;

  for (const { sub, tenant, offset, dueNum, paymentNumber } of due) {
    const key = `${sub.chatId}:${dueNum}:${offset}`;
    if (sent.has(key)) continue;
    try {
      await bot.api.sendMessage(sub.chatId, msg.reminderText(tenant, offset, dueNum, paymentNumber), { parse_mode: "HTML" });
      sent.add(key);
      log.keys.push(key);
      count++;
    } catch (e) {
      console.error(`[reminders] не доставлено ${sub.chatId} (${tenant.name}):`, e.message);
      // 403 = пользователь заблокировал бота → пауза, чтобы не долбить.
      if (e.error_code === 403 && subs[String(sub.chatId)]) {
        subs[String(sub.chatId)].status = "stopped";
        subsChanged = true;
      }
    }
  }
  saveSentLog(log);
  if (subsChanged) saveSubscribers(subs);
  if (count) console.log(`[reminders] отправлено ${count} (${new Date().toISOString()})`);
  return count;
}

// --- Старт -----------------------------------------------------------
cron.schedule(REMINDER_CRON, () => { runReminders().catch((e) => console.error(e)); }, { timezone: TZ });

async function main() {
  await bot.api.deleteWebhook().catch(() => {}); // polling и webhook взаимоисключающи
  console.log(`[bot] напоминания: "${REMINDER_CRON}" (${TZ}); арендаторов: ${tenants.length}; оператор: ${ADMIN_CHAT_ID ?? "не задан"}`);
  await bot.start({ onStart: (me) => console.log(`[bot] @${me.username} на связи (long polling).`) });
}

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

main().catch((e) => { console.error("[bot] фатально:", e); process.exit(1); });
