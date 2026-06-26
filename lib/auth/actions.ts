"use server";

// Server Actions кабинета: регистрация (привязка к договору), вход, выход.
// Server Actions дают CSRF-защиту из коробки (Next проверяет Origin/Host).
// Возвращают { error } для отрисовки в форме через useActionState; при
// успехе — redirect в кабинет.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  findUserByEmail,
  findUserByTenantId,
  putUser,
  type User,
} from "@/lib/auth/storage";
import { findTenantByContractAndSurname } from "@/lib/auth/tenants";
import { createSession, destroySession } from "@/lib/auth/session";
import { isOwnerEmail } from "@/lib/auth/owner";

export type ActionState = { error: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Примитивный rate-limit на вход (по IP, в памяти процесса) ---------
// Защищает от перебора паролей. Не персистентный — этого достаточно для
// одного процесса и десятка арендаторов.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : null)?.trim() || "local";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

function resetAttempts(ip: string) {
  attempts.delete(ip);
}

// --- Регистрация (привязка к существующему договору) -------------------

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const contract = String(formData.get("contract") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!contract || !surname) return { error: "Укажите номер договора и фамилию." };
  if (!EMAIL_RE.test(email)) return { error: "Некорректный email." };
  if (password.length < 8) return { error: "Пароль не короче 8 символов." };

  const tenant = await findTenantByContractAndSurname(contract, surname);
  if (!tenant) {
    return {
      error: "Договор с такой фамилией не найден. Проверьте номер и фамилию.",
    };
  }

  if (await findUserByTenantId(tenant.id)) {
    return { error: "Кабинет по этому договору уже создан. Войдите." };
  }
  if (await findUserByEmail(email)) {
    return { error: "Этот email уже зарегистрирован. Войдите." };
  }

  const user: User = {
    id: randomUUID(),
    email,
    passwordHash: await hashPassword(password),
    role: "tenant",
    tenantId: tenant.id,
    telegramId: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  await putUser(user);
  await createSession(user.id);
  redirect("/cabinet");
}

// --- Регистрация владельца (email из OWNER_EMAILS, без договора) --------

export async function registerOwnerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Некорректный email." };
  if (password.length < 8) return { error: "Пароль не короче 8 символов." };

  if (!isOwnerEmail(email)) {
    return { error: "Этот email не в списке владельцев (OWNER_EMAILS)." };
  }
  if (await findUserByEmail(email)) {
    return { error: "Аккаунт с этим email уже создан. Войдите." };
  }

  const user: User = {
    id: randomUUID(),
    email,
    passwordHash: await hashPassword(password),
    role: "owner",
    tenantId: null,
    telegramId: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  await putUser(user);
  await createSession(user.id);
  redirect("/cabinet/owner");
}

// --- Вход --------------------------------------------------------------

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = await clientIp();
  if (rateLimited(ip)) {
    return { error: "Слишком много попыток. Попробуйте через несколько минут." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    return { error: "Введите email и пароль." };
  }

  const user = await findUserByEmail(email);
  // Проверяем пароль даже при отсутствии юзера — чтобы не палить по времени
  // ответа, есть ли такой email (user enumeration).
  // Фиктивный хэш в реальном формате (pbkdf2, те же итерации) — чтобы
  // verifyPassword действительно прогонял PBKDF2 и время ответа не выдавало
  // отсутствие email (user enumeration).
  const DUMMY_HASH =
    "pbkdf2$100000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000";
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, DUMMY_HASH);

  if (!user || !ok) {
    return { error: "Неверный email или пароль." };
  }

  resetAttempts(ip);
  await putUser({ ...user, lastLoginAt: new Date().toISOString() });
  await createSession(user.id);
  redirect(user.role === "owner" ? "/cabinet/owner" : "/cabinet");
}

// --- Выход -------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/cabinet/login");
}
