// GET /api/auth/vk — старт входа через VK ID (OAuth 2.1 + PKCE): ставим
// state и code_verifier в cookie, уводим на страницу согласия VK.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { providerEnabled, randomState, pkcePair, vkAuthorizeUrl } from "@/lib/auth/oauth";

export const runtime = "nodejs";

const BASE = process.env.SITE_URL || "https://voltarenda.ru";

export async function GET() {
  if (!providerEnabled("vk")) {
    return NextResponse.redirect(new URL("/cabinet/login?oauth=off", BASE));
  }
  const state = randomState();
  const { verifier, challenge } = pkcePair();
  const store = await cookies();
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  store.set("oauth_state_vk", state, opts);
  store.set("oauth_verifier_vk", verifier, opts);
  return NextResponse.redirect(vkAuthorizeUrl(state, challenge));
}
