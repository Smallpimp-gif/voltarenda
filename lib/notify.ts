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
// успешное уведомление (заявка всё равно сохранена на диске / в БД).

const TELEGRAM_API = "https://api.telegram.org";

export async function notifyOperator(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Dev без настроенного бота — не шумим в логе.
    return;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      // Короткий таймаут — не ждём Telegram-API в ущерб отклику submit'а.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      console.error("[notify] Telegram sendMessage failed:", res.status, body);
    }
  } catch (err) {
    console.error("[notify] Telegram network error:", err);
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
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  photoCount: number;
}): string {
  const shortId = input.id.slice(0, 8);
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const tariffPrice = new Intl.NumberFormat("ru-RU").format(input.tariffPrice);

  // HTML-escape обязателен — имена могут содержать <, >, &.
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return [
    `🔔 <b>Новая заявка</b> <code>#${shortId}</code>`,
    "",
    `👤 ${esc(fullName)}`,
    `📞 <code>${esc(input.phone)}</code>`,
    `📧 ${esc(input.email)}`,
    "",
    `💳 ${esc(input.tariffName)} — ${tariffPrice} ₽`,
    `📸 Фото: ${input.photoCount}/3`,
    "",
    `🆔 <code>${input.id}</code>`,
  ].join("\n");
}
