// Сессии кабинета: непрозрачный токен в httpOnly-cookie + запись в
// data/auth/sessions.json. Непрозрачные токены (а не JWT) — чтобы можно
// было мгновенно отзывать сессию и не тащить подпись. Под Telegram-вход
// позже модель не меняется: создаём сессию тому же userId.

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import {
  getSession,
  putSession,
  deleteSession,
  getUserById,
  type User,
} from "@/lib/auth/storage";
import { getTenantById } from "@/lib/auth/tenants";
import type { Tenant } from "@/lib/schedule";

export const SESSION_COOKIE = "vr_session";
const MAX_AGE_DAYS = 30;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

// Создаёт сессию и ставит cookie. Зовётся из server actions после
// успешного входа/регистрации.
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  putSession(token, {
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + MAX_AGE_SECONDS * 1000).toISOString(),
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

// Снимает сессию: чистит запись в хранилище и cookie.
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  store.delete(SESSION_COOKIE);
}

// tenant === null у владельца, либо если запись арендатора удалили из
// tenants.json (тогда страница арендатора отправит на вход).
export type CurrentUser = { user: User; tenant: Tenant | null };

// Текущий пользователь по cookie или null. Используется в layout/page
// кабинета (server components, nodejs runtime — есть доступ к fs).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = getSession(token);
  if (!session) return null;

  const user = getUserById(session.userId);
  if (!user) return null;

  const tenant = user.tenantId ? getTenantById(user.tenantId) : null;
  return { user, tenant };
}
