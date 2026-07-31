// GET /api/auth/yandex — старт входа через Яндекс: ставим state в cookie и
// уводим на страницу согласия Яндекса.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { providerEnabled, randomState, yandexAuthorizeUrl } from "@/lib/auth/oauth";

export const runtime = "nodejs";

const BASE = process.env.SITE_URL || "https://voltarenda.ru";

export async function GET() {
  if (!providerEnabled("yandex")) {
    return NextResponse.redirect(new URL("/cabinet/login?oauth=off", BASE));
  }
  const state = randomState();
  (await cookies()).set("oauth_state_yandex", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(yandexAuthorizeUrl(state));
}
