// Вход через Telegram по deep-link (без формы с телефоном). Поток:
//   1) сайт создаёт токен (createLoginToken) и даёт ссылку t.me/bot?start=vlogin_<token>;
//   2) человек жмёт → открывается его Telegram → бот ловит /start vlogin_<token>
//      и подтверждает сайту, кто это (setLoginReady через /api/auth/tg-confirm);
//   3) сайт опрашивает статус (readLoginToken) и, как готово, ставит сессию.
// Токены живут 10 минут, одноразовые.

import { readJSON, writeJSON } from "@/lib/store";

export type TgLoginUser = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type Entry = { status: "pending" | "ready"; tg?: TgLoginUser; at: number };
type File = Record<string, Entry>;

const KEY = "bot/tg-login";
const TTL_MS = 10 * 60 * 1000;

function prune(file: File): File {
  const now = Date.now();
  for (const [k, v] of Object.entries(file)) {
    if (now - v.at > TTL_MS) delete file[k];
  }
  return file;
}

export async function createLoginToken(): Promise<string> {
  const { randomBytes } = await import("node:crypto");
  const token = randomBytes(18).toString("base64url");
  const file = prune(await readJSON<File>(KEY, {}));
  file[token] = { status: "pending", at: Date.now() };
  await writeJSON(KEY, file);
  return token;
}

export async function setLoginReady(token: string, tg: TgLoginUser): Promise<boolean> {
  const file = prune(await readJSON<File>(KEY, {}));
  const e = file[token];
  if (!e || e.status !== "pending") return false;
  file[token] = { status: "ready", tg, at: Date.now() };
  await writeJSON(KEY, file);
  return true;
}

export async function readLoginToken(token: string): Promise<Entry | null> {
  const file = await readJSON<File>(KEY, {});
  return file[token] ?? null;
}

export async function consumeLoginToken(token: string): Promise<void> {
  const file = await readJSON<File>(KEY, {});
  if (file[token]) {
    delete file[token];
    await writeJSON(KEY, file);
  }
}
