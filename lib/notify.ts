// Telegram notification — отправляет сообщение оператору в личный чат
// через Bot API. Используется из /api/apply/submit после успешного
// сохранения заявки. «Не потерять заявку» — сюда летит минимум инфы
// (имя, телефон, тариф, ID) + фото берут из data/photos через оператора.
//
// Env:
//   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
//   TELEGRAM_CHAT_ID   — chat_id оператора (получатель уведомлений)
//
// Если env не заданы — функция молча no-op'ит (dev без бота, либо CI).
// При ошибке сети логирует и не падает — submit заявки важнее, чем
// успешное уведомление (заявка всё равно сохранена в KV / на диске).
//
// РЕАЛИЗАЦИЯ: глобальный fetch — работает и в Node 20+, и в Cloudflare
// Workers (исходящее соединение к api.telegram.org, доступно из РФ).

export async function notifyOperator(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("[notify] Telegram sendMessage failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[notify] Telegram network error:", err);
  }
}

// Отправляет файл (договор .docx) оператору в Telegram. No-op без env.
export async function sendDocumentToOperator(
  blob: Blob,
  filename: string,
  caption?: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const form = new FormData();
    form.append("chat_id", chatId);
    if (caption) {
      form.append("caption", caption);
      form.append("parse_mode", "HTML");
    }
    form.append("document", blob, filename);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      console.error("[notify] sendDocument failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[notify] sendDocument error:", err);
  }
}

/**
 * Форматирует уведомление о новой заявке в HTML для Telegram.
 * HTML выбран вместо Markdown — меньше edge-cases с escape'ом
 * спецсимволов в именах/телефонах.
 */
export function formatApplicationNotification(input: {
  id: string;
  tariff: string;
  tariffName: string;
  tariffPrice: number;
  bikeModel?: string;
  battery?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email: string;
  telegram?: string;
  currentAddress?: string;
  passport?: {
    series?: string;
    number?: string;
    birthDate?: string;
    birthPlace?: string;
    issueDate?: string;
    departmentCode?: string;
    issuedBy?: string;
  };
  photoCount: number;
}): string {
  const shortId = input.id.slice(0, 8);
  const fullName = [input.lastName, input.firstName, input.middleName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const tariffPrice = new Intl.NumberFormat("ru-RU").format(input.tariffPrice);

  // HTML-escape обязателен — имена могут содержать <, >, &.
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = [
    `🔔 <b>Новая заявка</b> <code>#${shortId}</code>`,
    "",
    `👤 ${esc(fullName)}`,
    `📞 <code>${esc(input.phone)}</code>`,
    `📧 ${esc(input.email)}`,
  ];

  if (input.telegram) lines.push(`✈️ <a href="https://t.me/${esc(input.telegram)}">@${esc(input.telegram)}</a>`);
  if (input.currentAddress) lines.push(`🏠 ${esc(input.currentAddress)}`);

  const p = input.passport;
  if (p && (p.series || p.number || p.birthDate || p.issuedBy)) {
    const sn = [p.series, p.number].filter(Boolean).join(" ");
    lines.push("", "<b>Паспорт</b>");
    if (sn) lines.push(`📄 Серия/номер: <code>${esc(sn)}</code>`);
    if (p.birthDate) lines.push(`🎂 ДР: ${esc(p.birthDate)}`);
    if (p.birthPlace) lines.push(`📍 Место рождения: ${esc(p.birthPlace)}`);
    if (p.issueDate || p.departmentCode)
      lines.push(`🗓 Выдан: ${esc(p.issueDate || "")} ${p.departmentCode ? `· код ${esc(p.departmentCode)}` : ""}`.trim());
    if (p.issuedBy) lines.push(`🏛 ${esc(p.issuedBy)}`);
  }

  const bike = [input.bikeModel, input.battery].filter(Boolean).join(" · ");
  lines.push(
    "",
    ...(bike ? [`🚲 ${esc(bike)}`] : []),
    `💳 ${esc(input.tariffName)} — ${tariffPrice} ₽`,
    `📸 Фото: ${input.photoCount}/3`,
    "",
    `🆔 <code>${input.id}</code>`,
  );

  return lines.join("\n");
}
