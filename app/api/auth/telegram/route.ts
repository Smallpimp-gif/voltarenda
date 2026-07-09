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
import { findUserByTelegramId, findUserByTelegramUsername, putUser, type User } from "@/lib/auth/storage";
import { findTenantByTelegramUsername } from "@/lib/auth/tenants";
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
    const existing = await findUserByTelegramId(tid);
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
    await putUser(user);
    await createSession(user.id);
    return NextResponse.json({ status: "owner", redirect: "/cabinet/owner" });
  }

  // Существующий пользователь по telegram-id. Если договора ещё не было,
  // а владелец уже вписал этот ник арендатору — привязываем на входе.
  const user = await findUserByTelegramId(tid);
  if (user) {
    let tenantId = user.tenantId;
    if (!tenantId && tg.username) {
      const tenant = await findTenantByTelegramUsername(tg.username);
      if (tenant) tenantId = tenant.id;
    }
    await putUser({
      ...user,
      tenantId,
      telegramUsername: tg.username?.toLowerCase() ?? user.telegramUsername ?? null,
      lastLoginAt: new Date().toISOString(),
    });
    await createSession(user.id);
    return NextResponse.json({
      status: tenantId ? "tenant" : "user",
      redirect: tenantId ? "/cabinet" : "/cabinet/register",
    });
  }

  // Кабинет, созданный при заявке с сайта (по нику): привязываем telegramId
  // на первом входе — дальше человек узнаётся по id, напоминания доходят.
  if (tg.username) {
    const byUsername = await findUserByTelegramUsername(tg.username);
    if (byUsername) {
      let tenantId = byUsername.tenantId;
      if (!tenantId) {
        const tenant = await findTenantByTelegramUsername(tg.username);
        if (tenant) tenantId = tenant.id;
      }
      await putUser({
        ...byUsername,
        telegramId: tid,
        tenantId,
        lastLoginAt: new Date().toISOString(),
      });
      await createSession(byUsername.id);
      return NextResponse.json({
        status: tenantId ? "tenant" : "user",
        redirect: tenantId ? "/cabinet" : "/cabinet/register",
      });
    }
  }

  // Авто-привязка по Telegram-нику: если владелец вписал ник в карточке
  // арендатора — создаём ему аккаунт, привязываем к договору, пускаем в
  // кабинет. Заодно сохраняется telegramId → дойдут напоминания.
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
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await putUser(linked);
      await createSession(linked.id);
      return NextResponse.json({ status: "tenant", redirect: "/cabinet" });
    }
  }

  // Новый человек — аккаунта ещё нет.
  return NextResponse.json({ status: "new", tg: { id: tid, name } });
}
