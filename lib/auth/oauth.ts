// OAuth-вход через VK ID и Яндекс. Гейтится секретами: если client_id не
// задан — провайдер выключен (кнопка скрыта, роут отвечает 404-редиректом).
// После успешного входа: ищем юзера по провайдер-id, затем по email, иначе
// создаём нового арендатора без договора (владелец привяжет). Роль — tenant.
//
// ⚠️ Точные параметры токен-обмена VK ID (PKCE + device_id) выверить на
// реальном приложении VK — вся провайдер-специфика собрана здесь.

import { randomBytes, createHash, randomUUID } from "node:crypto";
import {
  findUserByVkId,
  findUserByYandexId,
  findUserByEmail,
  putUser,
  type User,
} from "@/lib/auth/storage";
import { createSession } from "@/lib/auth/session";

export type Provider = "vk" | "yandex";

function siteUrl(): string {
  return process.env.SITE_URL || "https://voltarenda.ru";
}

export function redirectUri(p: Provider): string {
  return `${siteUrl()}/api/auth/${p}/callback`;
}

export function providerEnabled(p: Provider): boolean {
  if (p === "vk") return Boolean(process.env.VK_CLIENT_ID);
  return Boolean(process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET);
}

// --- PKCE / state -----------------------------------------------------

export function randomState(): string {
  return randomBytes(16).toString("hex");
}

export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

// --- Authorize URLs ---------------------------------------------------

export function vkAuthorizeUrl(state: string, challenge: string): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: process.env.VK_CLIENT_ID ?? "",
    redirect_uri: redirectUri("vk"),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "email",
  });
  return `https://id.vk.ru/authorize?${p.toString()}`;
}

export function yandexAuthorizeUrl(state: string): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: process.env.YANDEX_CLIENT_ID ?? "",
    redirect_uri: redirectUri("yandex"),
    state,
  });
  return `https://oauth.yandex.ru/authorize?${p.toString()}`;
}

// --- Обмен кода на профиль -------------------------------------------

export type OAuthProfile = { providerId: string; email: string; name: string };

export async function vkExchange(
  code: string,
  verifier: string,
  deviceId: string,
): Promise<OAuthProfile | null> {
  try {
    const tokenRes = await fetch("https://id.vk.ru/oauth2/auth", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier: verifier,
        client_id: process.env.VK_CLIENT_ID ?? "",
        device_id: deviceId,
        redirect_uri: redirectUri("vk"),
      }),
    });
    if (!tokenRes.ok) return null;
    const tok = (await tokenRes.json()) as { access_token?: string };
    if (!tok.access_token) return null;

    const infoRes = await fetch("https://id.vk.ru/oauth2/user_info", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.VK_CLIENT_ID ?? "",
        access_token: tok.access_token,
      }),
    });
    if (!infoRes.ok) return null;
    const data = (await infoRes.json()) as {
      user?: { user_id?: string; first_name?: string; last_name?: string; email?: string };
    };
    const u = data.user;
    if (!u?.user_id) return null;
    return {
      providerId: String(u.user_id),
      email: (u.email ?? "").toLowerCase(),
      name: [u.first_name, u.last_name].filter(Boolean).join(" ").trim(),
    };
  } catch {
    return null;
  }
}

export async function yandexExchange(code: string): Promise<OAuthProfile | null> {
  try {
    const tokenRes = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.YANDEX_CLIENT_ID ?? "",
        client_secret: process.env.YANDEX_CLIENT_SECRET ?? "",
      }),
    });
    if (!tokenRes.ok) return null;
    const tok = (await tokenRes.json()) as { access_token?: string };
    if (!tok.access_token) return null;

    const infoRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tok.access_token}` },
    });
    if (!infoRes.ok) return null;
    const info = (await infoRes.json()) as {
      id?: string;
      default_email?: string;
      real_name?: string;
      display_name?: string;
      login?: string;
    };
    if (!info.id) return null;
    return {
      providerId: String(info.id),
      email: (info.default_email ?? "").toLowerCase(),
      name: info.real_name ?? info.display_name ?? info.login ?? "",
    };
  } catch {
    return null;
  }
}

// --- Вход/создание пользователя --------------------------------------

// Возвращает путь для редиректа после входа.
export async function loginWithProvider(p: Provider, profile: OAuthProfile): Promise<string> {
  const now = new Date().toISOString();
  const idField = p === "vk" ? "vkId" : "yandexId";

  let user =
    p === "vk"
      ? await findUserByVkId(profile.providerId)
      : await findUserByYandexId(profile.providerId);
  if (!user && profile.email) user = await findUserByEmail(profile.email);

  if (user) {
    await putUser({
      ...user,
      [idField]: profile.providerId,
      email: user.email || profile.email,
      lastLoginAt: now,
    });
  } else {
    const created: User = {
      id: randomUUID(),
      email: (profile.email || `${p}${profile.providerId}@social.local`).toLowerCase(),
      passwordHash: "",
      role: "tenant",
      tenantId: null,
      telegramId: null,
      vkId: p === "vk" ? profile.providerId : null,
      yandexId: p === "yandex" ? profile.providerId : null,
      createdAt: now,
      lastLoginAt: now,
    };
    await putUser(created);
    user = created;
  }

  await createSession(user.id);
  return user.tenantId ? "/cabinet" : "/cabinet/register";
}
