// Хранилище кабинетов — простые JSON-файлы в data/auth/ (вне репозитория,
// .gitignore исключает data/). Как и у бота: десяток арендаторов, один
// процесс, гонок практически нет. Запись атомарная (tmp + rename), чтобы
// файл не побился при падении процесса посреди записи.
//
//   users.json     — аккаунты: email + пароль ↔ арендатор (tenantId)
//   sessions.json  — активные сессии: token ↔ userId
//
// При росте → PostgreSQL + шифрование ПДн (тот же TODO, что в apply/submit).

import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data", "auth");

export type Role = "tenant" | "owner";

export type User = {
  id: string;
  email: string; // в нижнем регистре, уникальный
  passwordHash: string;
  role: Role;
  tenantId: string | null; // ссылка на data/bot/tenants.json; null у владельца
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

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load<T>(file: string, fallback: T): T {
  const p = path.join(DATA_DIR, file);
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as T;
  } catch (err) {
    console.error(`[auth/storage] не смог прочитать ${file}:`, (err as Error).message);
    return fallback;
  }
}

function save(file: string, data: unknown) {
  ensureDir();
  const p = path.join(DATA_DIR, file);
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  renameSync(tmp, p); // атомарно на той же ФС
}

// --- Пользователи -----------------------------------------------------

export function loadUsers(): UsersFile {
  return load<UsersFile>("users.json", {});
}

export function saveUsers(users: UsersFile) {
  save("users.json", users);
}

export function findUserByEmail(email: string): User | null {
  const users = loadUsers();
  const norm = email.trim().toLowerCase();
  return Object.values(users).find((u) => u.email === norm) ?? null;
}

export function findUserByTenantId(tenantId: string): User | null {
  const users = loadUsers();
  return Object.values(users).find((u) => u.tenantId === tenantId) ?? null;
}

export function findUserByTelegramId(telegramId: string): User | null {
  const users = loadUsers();
  return Object.values(users).find((u) => u.telegramId === telegramId) ?? null;
}

export function getUserById(id: string): User | null {
  return loadUsers()[id] ?? null;
}

export function putUser(user: User) {
  const users = loadUsers();
  users[user.id] = user;
  saveUsers(users);
}

// --- Сессии -----------------------------------------------------------

export function loadSessions(): SessionsFile {
  return load<SessionsFile>("sessions.json", {});
}

export function saveSessions(sessions: SessionsFile) {
  save("sessions.json", sessions);
}

export function putSession(token: string, session: Session) {
  const sessions = loadSessions();
  // Попутно подчищаем протухшие сессии, чтобы файл не разрастался.
  const now = Date.now();
  for (const [t, s] of Object.entries(sessions)) {
    if (new Date(s.expiresAt).getTime() < now) delete sessions[t];
  }
  sessions[token] = session;
  saveSessions(sessions);
}

export function getSession(token: string): Session | null {
  const s = loadSessions()[token];
  if (!s) return null;
  if (new Date(s.expiresAt).getTime() < Date.now()) return null;
  return s;
}

export function deleteSession(token: string) {
  const sessions = loadSessions();
  if (sessions[token]) {
    delete sessions[token];
    saveSessions(sessions);
  }
}
