// POST /api/telegram/webhook
//
// Webhook бота @voltarenda_bot. Telegram шлёт сюда апдейты. Обрабатываем
// /start: здороваемся, показываем сколько велосипедов свободно и зовём в
// кабинет. Заодно запоминаем username → chat_id (для напоминаний об оплате).
//
// Защита: заголовок X-Telegram-Bot-Api-Secret-Token == TELEGRAM_WEBHOOK_SECRET
// (задаётся при setWebhook).

import { NextResponse } from "next/server";
import { getAvailableBikes } from "@/lib/settings";
import { readJSON, writeJSON } from "@/lib/store";
import { setLoginReady } from "@/lib/tg-login";

export const runtime = "nodejs";

const APP_URL = "https://voltarenda.small-pimp.workers.dev/app";

type TgUpdate = {
  message?: {
    chat?: { id?: number };
    from?: { id?: number; username?: string; first_name?: string; last_name?: string };
    text?: string;
  };
};

async function send(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: "🚲 Открыть кабинет", web_app: { url: APP_URL } }]],
      },
    }),
  });
}

// Простое сообщение без кнопки Mini App (для подтверждения веб-входа).
async function sendPlain(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}

// Запоминаем username → chat_id, чтобы напоминания могли дойти до арендатора.
async function rememberChat(username: string | undefined, chatId: number) {
  if (!username) return;
  const key = "bot/tg-chats";
  const map = await readJSON<Record<string, number>>(key, {});
  if (map[username.toLowerCase()] !== chatId) {
    map[username.toLowerCase()] = chatId;
    await writeJSON(key, map);
  }
}

function bikesWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "велосипед";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "велосипеда";
  return "велосипедов";
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  const chatId = msg?.chat?.id;
  const text = (msg?.text ?? "").trim();

  // Вход на сайт без номера: deep-link /start vlogin_<token>. Помечаем токен
  // готовым (кто вошёл), сайт опрашивает tg-poll и открывает кабинет.
  const vlogin = text.match(/^\/start\s+vlogin_(\S+)/);
  if (token && chatId && vlogin) {
    const from = msg?.from;
    const ok = await setLoginReady(vlogin[1], {
      id: String(from?.id ?? chatId),
      first_name: from?.first_name,
      last_name: from?.last_name,
      username: from?.username,
    });
    await sendPlain(
      token,
      chatId,
      ok
        ? "✅ Готово! Вернись на сайт — вход выполнен."
        : "Ссылка для входа устарела. Открой вход на сайте заново.",
    );
    return NextResponse.json({ ok: true });
  }

  if (token && chatId && text.startsWith("/start")) {
    await rememberChat(msg?.from?.username, chatId);
    const bikes = await getAvailableBikes();
    const name = msg?.from?.first_name ? `, ${msg.from.first_name}` : "";
    const free =
      bikes > 0
        ? `🚲 Сейчас свободно: <b>${bikes}</b> ${bikesWord(bikes)}.`
        : "🚲 Сейчас все велосипеды разобраны — но напиши, поставим в очередь.";
    const greeting =
      `👋 Привет${name}! Это <b>Вольтаренда</b> — электровелосипеды в аренду для курьеров Санкт-Петербурга.\n\n` +
      `${free}\n\n` +
      `Нажми кнопку <b>«Открыть кабинет»</b> ниже (или «Кабинет» слева от поля ввода), чтобы:\n` +
      `• выбрать велосипед и оформить аренду за пару минут;\n` +
      `• а если у тебя уже есть договор — посмотреть свои платежи.\n\n` +
      `Поддержка: @voltarenda_bike`;
    await send(token, chatId, greeting);
  }

  return NextResponse.json({ ok: true });
}
