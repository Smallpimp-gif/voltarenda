// GET /api/auth/tg-start — создаёт токен для входа через Telegram по deep-link
// и возвращает ссылку на бота. Фронт открывает ссылку и опрашивает tg-poll.

import { NextResponse } from "next/server";
import { createLoginToken } from "@/lib/tg-login";

export const runtime = "nodejs";

export async function GET() {
  const bot = process.env.TELEGRAM_BOT_USERNAME;
  if (!bot) return NextResponse.json({ error: "off" }, { status: 404 });
  const token = await createLoginToken();
  return NextResponse.json({
    token,
    url: `https://t.me/${bot}?start=vlogin_${token}`,
  });
}
