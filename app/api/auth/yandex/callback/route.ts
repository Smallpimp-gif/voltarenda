// GET /api/auth/yandex/callback — Яндекс вернул code. Проверяем state,
// меняем code на профиль, входим/создаём пользователя, ставим сессию.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { yandexExchange, loginWithProvider } from "@/lib/auth/oauth";

export const runtime = "nodejs";

const BASE = process.env.SITE_URL || "https://voltarenda.ru";
const fail = () => NextResponse.redirect(new URL("/cabinet/login?oauth=fail", BASE));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const saved = store.get("oauth_state_yandex")?.value;
  store.delete("oauth_state_yandex");

  if (!code || !state || !saved || state !== saved) return fail();
  const profile = await yandexExchange(code);
  if (!profile) return fail();
  const dest = await loginWithProvider("yandex", profile);
  return NextResponse.redirect(new URL(dest, BASE));
}
