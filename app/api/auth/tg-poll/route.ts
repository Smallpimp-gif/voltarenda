// GET /api/auth/tg-poll?token=... — фронт опрашивает статус deep-link входа.
// Как только бот подтвердил (status ready) — находим/создаём пользователя,
// ставим сессию и отдаём redirect. Токен одноразовый.

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readLoginToken, consumeLoginToken } from "@/lib/tg-login";
import { isOwnerTelegramId, isOwnerTelegramUsername } from "@/lib/auth/owner";
import { findUserByTelegramId, findUserByTelegramUsername, putUser, type User } from "@/lib/auth/storage";
import { findTenantByTelegramUsername } from "@/lib/auth/tenants";
import { createSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ status: "bad" }, { status: 400 });

  const entry = await readLoginToken(token);
  if (!entry) return NextResponse.json({ status: "expired" });
  if (entry.status !== "ready" || !entry.tg) return NextResponse.json({ status: "pending" });

  const tg = entry.tg;
  await consumeLoginToken(token);
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
    return NextResponse.json({ status: "ok", redirect: "/cabinet/owner" });
  }

  // Существующий пользователь по telegramId / нику.
  const found =
    (await findUserByTelegramId(tid)) ??
    (tg.username ? await findUserByTelegramUsername(tg.username) : null);
  if (found) {
    let tenantId = found.tenantId;
    if (!tenantId && tg.username) {
      const t = await findTenantByTelegramUsername(tg.username);
      if (t) tenantId = t.id;
    }
    await putUser({
      ...found,
      telegramId: tid,
      tenantId,
      telegramUsername: tg.username?.toLowerCase() ?? found.telegramUsername ?? null,
      lastLoginAt: now,
    });
    await createSession(found.id);
    return NextResponse.json({ status: "ok", redirect: tenantId ? "/cabinet" : "/cabinet/register" });
  }

  // Оператор вписал ник арендатору → создаём и привязываем.
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
      return NextResponse.json({ status: "ok", redirect: "/cabinet" });
    }
  }

  // Новый человек — без договора.
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
  return NextResponse.json({ status: "ok", redirect: "/cabinet/register" });
}
