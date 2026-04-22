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
//
// РЕАЛИЗАЦИЯ: два пути.
// 1) prod / Linux host: node:https.request — нативный TCP + TLS из Node,
//    работает без внешних зависимостей.
// 2) dev / win32: fallback через child_process spawn('curl'). На dev-
//    машине под Windows Defender/Firewall часто режет outbound https
//    для node.exe, но разрешает curl.exe (система). Диагностировано на
//    этом конкретном окружении: https.request timeout за 15s, curl той
//    же IP — 200 OK за 300ms. В production fallback не активируется.

import https from "node:https";
import { spawn } from "node:child_process";

export async function notifyOperator(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const payload = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  // Dev + win32: сразу через curl. В проде (NODE_ENV=production) —
  // через node:https (см. сверху, почему).
  const useCurl =
    process.env.NODE_ENV !== "production" && process.platform === "win32";
  if (useCurl) {
    return sendViaCurl(token, payload);
  }
  return sendViaHttps(token, payload);
}

function sendViaHttps(token: string, payload: string): Promise<void> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: "POST",
        family: 4, // force IPv4 — избегаем IPv6 happy-eyeballs hang
        timeout: 15000,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if ((res.statusCode ?? 500) >= 400) {
            console.error(
              "[notify] Telegram sendMessage failed:",
              res.statusCode,
              body,
            );
          }
          resolve();
        });
      },
    );

    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (err) => {
      console.error("[notify] Telegram network error (https):", err);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

function sendViaCurl(token: string, payload: string): Promise<void> {
  return new Promise((resolve) => {
    // -s silent, --max-time 15 таймаут, --data-binary @- читает payload
    // со stdin (избегаем cmd.exe-квотинга для русских символов).
    const curl = spawn("curl", [
      "-s",
      "--max-time",
      "15",
      "-X",
      "POST",
      "-H",
      "Content-Type: application/json; charset=utf-8",
      "--data-binary",
      "@-",
      `https://api.telegram.org/bot${token}/sendMessage`,
    ]);

    let stdout = "";
    let stderr = "";
    curl.stdout.on("data", (c) => (stdout += c));
    curl.stderr.on("data", (c) => (stderr += c));
    curl.on("error", (err) => {
      console.error("[notify] curl spawn error:", err);
      resolve();
    });
    curl.on("close", (code) => {
      if (code !== 0) {
        console.error("[notify] curl exit", code, "stderr:", stderr);
      } else if (!stdout.includes('"ok":true')) {
        console.error("[notify] Telegram responded non-ok:", stdout);
      }
      resolve();
    });

    curl.stdin.write(payload);
    curl.stdin.end();
  });
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
