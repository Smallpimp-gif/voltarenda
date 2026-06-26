// Тексты сообщений бота. HTML parse_mode (как в lib/notify.ts) — меньше
// возни с экранированием. Имена из нашей таблицы, но экранируем на
// случай < > & в данных.

import { formatDay, nextDue } from "./schedule.mjs";

const PHONE = "+7 (901) 300-03-19";
const TG = "@voltarenda_bot";

const fmt = new Intl.NumberFormat("ru-RU");
export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const WHEN = { 0: "сегодня", 1: "завтра", 2: "послезавтра" };

export function welcomeUnlinked() {
  return [
    "👋 Привет! Это бот напоминаний об оплате — <b>Вольтаренда</b>.",
    "",
    "Я передал оператору, что ты на связи. Как только он подтвердит тебя, начну заранее напоминать о недельном платеже за велосипед.",
  ].join("\n");
}

export function welcomeAlreadyLinked(tenant, todayNum) {
  return ["✅ Ты уже на связи.", "", statusText(tenant, todayNum)].join("\n");
}

export function linkedConfirm(tenant) {
  const amount = fmt.format(tenant.weekly);
  return [
    "✅ Готово! Подключил напоминания.",
    "",
    `Недельный платёж: <b>${amount} ₽</b>.`,
    "Буду писать за 2 дня, за день и в день оплаты.",
    "",
    "Команда /status — посмотреть ближайший платёж.",
  ].join("\n");
}

export function statusText(tenant, todayNum) {
  const { dueNum, paymentNumber, completed } = nextDue(tenant, todayNum);
  const amount = fmt.format(tenant.weekly);
  if (completed) {
    return "🎉 Выкуп выплачен полностью — платежей больше нет. Спасибо!";
  }
  const lines = [
    `📅 Ближайший платёж: <b>${formatDay(dueNum)}</b>`,
    `Сумма: <b>${amount} ₽</b>`,
  ];
  if (tenant.buyoutWeeks) lines.push(`Выкуп: платёж ${paymentNumber} из ${tenant.buyoutWeeks}`);
  return lines.join("\n");
}

export function reminderText(tenant, offset, dueNum, paymentNumber) {
  const amount = fmt.format(tenant.weekly);
  const lines = [
    "🔔 <b>Напоминание об оплате</b>",
    "",
    `Недельный платёж за велосипед — <b>${WHEN[offset]}</b> (${formatDay(dueNum)}).`,
    `Сумма: <b>${amount} ₽</b>.`,
  ];
  if (tenant.buyoutWeeks) lines.push(`Выкуп: платёж ${paymentNumber} из ${tenant.buyoutWeeks}.`);
  lines.push("", `Оплата как обычно. Вопросы: ${TG} · ${PHONE}`);
  return lines.join("\n");
}

export function adminNewUser(sub) {
  const uname = sub.username ? `@${esc(sub.username)}` : "(без username)";
  return [
    "🆕 <b>Новый пользователь нажал «Старт»</b>",
    "",
    `Имя в Telegram: ${esc(sub.firstName) || "—"}`,
    `Username: ${uname}`,
    `chat_id: <code>${sub.chatId}</code>`,
    "",
    "Кто это из арендаторов?",
  ].join("\n");
}

export function adminLinked(sub, tenant) {
  const uname = sub.username ? `@${esc(sub.username)}` : `chat ${sub.chatId}`;
  return `✅ ${esc(tenant.name)} ← ${uname} (${esc(sub.firstName)})`;
}
