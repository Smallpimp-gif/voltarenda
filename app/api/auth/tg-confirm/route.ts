// POST /api/auth/tg-confirm — бот подтверждает вход по deep-link. Тело:
//   { token, user: {id, first_name, last_name?, username?}, sig }
// sig = HMAC-SHA256(bot_token, token) в hex. Проверяем подпись бот-токеном —
// только наш бот знает токен, значит запрос доверенный (Origin не нужен).

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { setLoginReady, type TgLoginUser } from "@/lib/tg-login";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ error: "off" }, { status: 404 });

  let body: { token?: string; user?: TgLoginUser; sig?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const token = String(body.token ?? "");
  const sig = String(body.sig ?? "");
  const user = body.user;
  if (!token || !sig || !user?.id) return NextResponse.json({ error: "bad" }, { status: 400 });

  const expected = createHmac("sha256", botToken).update(token).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "sig" }, { status: 401 });
  }

  const ok = await setLoginReady(token, {
    id: String(user.id),
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
  });
  return NextResponse.json({ ok });
}
