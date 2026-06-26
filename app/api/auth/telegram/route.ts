// POST /api/auth/telegram
//
// Вход через Telegram Mini App. Принимает { initData } от Telegram WebApp,
// проверяет подпись бот-токеном (lib/auth/telegram), затем:
//   - владелец (telegram-id в OWNER_TELEGRAM_IDS) → сессия владельца;
//   - существующий пользователь (по telegramId) → его сессия;
//   - новый человек → { status: "new" } (фронт предложит оформить/войти).

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { verifyInitData } from "@/lib/auth/telegram";
import { isOwnerTelegramId, isOwnerTelegramUsername } from "@/lib/auth/owner";
import { findUserByTelegramId, putUser, type User } from "@/lib/auth/storage";
import { createSession } from "@/lib/auth/session";
import { isAllowedOrigin } from "@/lib/api-origin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }

  let body: { initData?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const tg = verifyInitData(String(body.initData ?? ""));
  if (!tg) {
    return NextResponse.json({ status: "invalid" }, { status: 401 });
  }
  const tid = String(tg.id);
  const name = [tg.first_name, tg.last_name].filter(Boolean).join(" ").trim();

  // Владелец по telegram-id или юзернейму — создаём/обновляем аккаунт.
  if (isOwnerTelegramId(tid) || isOwnerTelegramUsername(tg.username)) {
    const existing = findUserByTelegramId(tid);
    const user: User = {
      id: existing?.id ?? randomUUID(),
      email: existing?.email ?? `tg${tid}@telegram.local`,
      passwordHash: existing?.passwordHash ?? "",
      role: "owner",
      tenantId: null,
      telegramId: tid,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    putUser(user);
    await createSession(user.id);
    return NextResponse.json({ status: "owner", redirect: "/cabinet/owner" });
  }

  // Существующий пользователь по telegram-id.
  const user = findUserByTelegramId(tid);
  if (user) {
    putUser({ ...user, lastLoginAt: new Date().toISOString() });
    await createSession(user.id);
    return NextResponse.json({
      status: user.tenantId ? "tenant" : "user",
      redirect: user.tenantId ? "/cabinet" : "/cabinet/register",
    });
  }

  // Новый человек — аккаунта ещё нет.
  return NextResponse.json({ status: "new", tg: { id: tid, name } });
}
