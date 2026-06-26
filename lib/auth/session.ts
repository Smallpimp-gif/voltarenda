// Сессии кабинета: непрозрачный токен в httpOnly-cookie + запись в
// хранилище (lib/store). Непрозрачные токены (не JWT) — мгновенный отзыв.

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

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  await putSession(token, {
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

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  store.delete(SESSION_COOKIE);
}

export type CurrentUser = { user: User; tenant: Tenant | null };

// Текущий пользователь по cookie или null. Server-only (nodejs runtime).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getSession(token);
  if (!session) return null;

  const user = await getUserById(session.userId);
  if (!user) return null;

  const tenant = user.tenantId ? await getTenantById(user.tenantId) : null;
  return { user, tenant };
}
