// GET /api/auth/vk/callback — VK ID вернул code + device_id. Проверяем state,
// меняем code (+ code_verifier + device_id) на профиль, входим/создаём юзера.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { vkExchange, loginWithProvider } from "@/lib/auth/oauth";

export const runtime = "nodejs";

const BASE = process.env.SITE_URL || "https://voltarenda.ru";
const fail = () => NextResponse.redirect(new URL("/cabinet/login?oauth=fail", BASE));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const deviceId = url.searchParams.get("device_id") ?? "";
  const store = await cookies();
  const savedState = store.get("oauth_state_vk")?.value;
  const verifier = store.get("oauth_verifier_vk")?.value ?? "";
  store.delete("oauth_state_vk");
  store.delete("oauth_verifier_vk");

  if (!code || !state || !savedState || state !== savedState || !verifier) return fail();
  const profile = await vkExchange(code, verifier, deviceId);
  if (!profile) return fail();
  const dest = await loginWithProvider("vk", profile);
  return NextResponse.redirect(new URL(dest, BASE));
}
