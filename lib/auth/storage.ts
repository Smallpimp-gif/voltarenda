// Хранилище кабинетов — через lib/store (KV в облаке / файлы локально).
// Все функции async (KV сетевой). При росте/ПДн → отдельная БД с шифрованием.

import { readJSON, writeJSON } from "@/lib/store";

export type Role = "tenant" | "owner";

export type User = {
  id: string;
  email: string; // в нижнем регистре, уникальный
  passwordHash: string;
  role: Role;
  tenantId: string | null; // ссылка на bot/tenants; null у владельца
  telegramId: string | null; // задел под Telegram-вход
  createdAt: string; // ISO
  lastLoginAt: string | null;
};

export type Session = {
  userId: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO
};

type UsersFile = Record<string, User>;
type SessionsFile = Record<string, Session>;

const USERS_KEY = "auth/users";
const SESSIONS_KEY = "auth/sessions";

// --- Пользователи -----------------------------------------------------

export async function loadUsers(): Promise<UsersFile> {
  return readJSON<UsersFile>(USERS_KEY, {});
}

export async function saveUsers(users: UsersFile): Promise<void> {
  await writeJSON(USERS_KEY, users);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await loadUsers();
  const norm = email.trim().toLowerCase();
  return Object.values(users).find((u) => u.email === norm) ?? null;
}

export async function findUserByTenantId(tenantId: string): Promise<User | null> {
  const users = await loadUsers();
  return Object.values(users).find((u) => u.tenantId === tenantId) ?? null;
}

export async function findUserByTelegramId(telegramId: string): Promise<User | null> {
  const users = await loadUsers();
  return Object.values(users).find((u) => u.telegramId === telegramId) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  return (await loadUsers())[id] ?? null;
}

export async function putUser(user: User): Promise<void> {
  const users = await loadUsers();
  users[user.id] = user;
  await saveUsers(users);
}

// --- Сессии -----------------------------------------------------------

export async function loadSessions(): Promise<SessionsFile> {
  return readJSON<SessionsFile>(SESSIONS_KEY, {});
}

export async function saveSessions(sessions: SessionsFile): Promise<void> {
  await writeJSON(SESSIONS_KEY, sessions);
}

export async function putSession(token: string, session: Session): Promise<void> {
  const sessions = await loadSessions();
  // Подчищаем протухшие, чтобы не разрастались.
  const now = Date.now();
  for (const [t, s] of Object.entries(sessions)) {
    if (new Date(s.expiresAt).getTime() < now) delete sessions[t];
  }
  sessions[token] = session;
  await saveSessions(sessions);
}

export async function getSession(token: string): Promise<Session | null> {
  const s = (await loadSessions())[token];
  if (!s) return null;
  if (new Date(s.expiresAt).getTime() < Date.now()) return null;
  return s;
}

export async function deleteSession(token: string): Promise<void> {
  const sessions = await loadSessions();
  if (sessions[token]) {
    delete sessions[token];
    await saveSessions(sessions);
  }
}
