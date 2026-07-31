// GET /api/auth/telegram/widget — колбэк Telegram Login Widget (вход с сайта).
// Telegram редиректит сюда с полями пользователя и подписью. Проверяем подпись,
// входим/создаём пользователя, привязываем к договору по нику, ставим сессию.

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { verifyWidgetAuth } from "@/lib/auth/telegram";
import { isOwnerTelegramId, isOwnerTelegramUsername } from "@/lib/auth/owner";
import { findUserByTelegramId, findUserByTelegramUsername, putUser, type User } from "@/lib/auth/storage";
import { findTenantByTelegramUsername } from "@/lib/auth/tenants";
import { createSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const BASE = process.env.SITE_URL || "https://voltarenda.ru";
const go = (path: string) => NextResponse.redirect(new URL(path, BASE));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fields: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) fields[k] = v;

  const tg = verifyWidgetAuth(fields);
  if (!tg) return go("/cabinet/login?oauth=fail");
  const tid = String(tg.id);
  const now = new Date().toISOString();

  // Владелец.
  if (isOwnerTelegramId(tid) || isOwnerTelegramUsername(tg.username)) {
    const existing = await findUserByTelegramId(tid);
    const user: User = {
      id: existing?.id ?? randomUUID(),
      email: existing?.email ?? `tg${tid}@telegram.local`,
      passwordHash: existing?.passwordHash ?? "",
      role: "owner",
      tenantId: null,
      telegramId: tid,
      telegramUsername: tg.username?.toLowerCase() ?? existing?.telegramUsername ?? null,
      createdAt: existing?.createdAt ?? now,
      lastLoginAt: now,
    };
    await putUser(user);
    await createSession(user.id);
    return go("/cabinet/owner");
  }

  // Существующий пользователь по telegramId (или ранее заведённый по нику).
  const user =
    (await findUserByTelegramId(tid)) ??
    (tg.username ? await findUserByTelegramUsername(tg.username) : null);
  if (user) {
    let tenantId = user.tenantId;
    if (!tenantId && tg.username) {
      const t = await findTenantByTelegramUsername(tg.username);
      if (t) tenantId = t.id;
    }
    await putUser({
      ...user,
      telegramId: tid,
      tenantId,
      telegramUsername: tg.username?.toLowerCase() ?? user.telegramUsername ?? null,
      lastLoginAt: now,
    });
    await createSession(user.id);
    return go(tenantId ? "/cabinet" : "/cabinet/register");
  }

  // Владелец вписал ник в карточку арендатора → создаём аккаунт, привязываем.
  if (tg.username) {
    const tenant = await findTenantByTelegramUsername(tg.username);
    if (tenant) {
      const linked: User = {
        id: randomUUID(),
        email: `tg${tid}@telegram.local`,
        passwordHash: "",
        role: "tenant",
        tenantId: tenant.id,
        telegramId: tid,
        telegramUsername: tg.username.toLowerCase(),
        createdAt: now,
        lastLoginAt: now,
      };
      await putUser(linked);
      await createSession(linked.id);
      return go("/cabinet");
    }
  }

  // Новый человек — аккаунт без договора, дальше оформит/привяжется.
  const created: User = {
    id: randomUUID(),
    email: `tg${tid}@telegram.local`,
    passwordHash: "",
    role: "tenant",
    tenantId: null,
    telegramId: tid,
    telegramUsername: tg.username?.toLowerCase() ?? null,
    createdAt: now,
    lastLoginAt: now,
  };
  await putUser(created);
  await createSession(created.id);
  return go("/cabinet/register");
}
