// Вход через Telegram по deep-link (без формы с телефоном). Поток:
//   1) сайт создаёт токен (createLoginToken) и даёт ссылку t.me/bot?start=vlogin_<token>;
//   2) человек жмёт → открывается его Telegram → бот-webhook ловит
//      /start vlogin_<token> и помечает токен готовым (setLoginReady);
//   3) сайт опрашивает статус (readLoginToken) и, как готово, ставит сессию.
//
// ВАЖНО: каждый токен — ОТДЕЛЬНЫЙ ключ KV (`bot/tglogin/<token>`), а не общая
// карта. Это убирает гонку read-modify-write при параллельных входах и, главное,
// делает setLoginReady независимым от чтения: webhook пишет `ready` вслепую, не
// дожидаясь, пока запись pending от createLoginToken распространится по KV
// (eventual consistency). Раньше из-за этого реальный вход (Старт через пару
// секунд) не срабатывал. Токены живут 10 минут (TTL на уровне KV), одноразовые.

import { readJSON, writeJSON, deleteKey } from "@/lib/store";

export type TgLoginUser = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type Entry = { status: "pending" | "ready"; tg?: TgLoginUser; at: number };

const TTL_MS = 10 * 60 * 1000;
const TTL_S = 10 * 60;

function keyFor(token: string): string {
  return `bot/tglogin/${token}`;
}

export async function createLoginToken(): Promise<string> {
  const { randomBytes } = await import("node:crypto");
  const token = randomBytes(18).toString("base64url");
  await writeJSON(keyFor(token), { status: "pending", at: Date.now() } satisfies Entry, {
    ttlSeconds: TTL_S,
  });
  return token;
}

// Помечаем токен готовым БЕЗ предварительного чтения — иммунитет к лагу KV.
// Токен — неугадываемый секрет (сгенерён сервером, прошёл через нашего бота),
// а webhook защищён секретом Telegram, поэтому «слепая» запись безопасна.
export async function setLoginReady(token: string, tg: TgLoginUser): Promise<boolean> {
  if (!token) return false;
  await writeJSON(keyFor(token), { status: "ready", tg, at: Date.now() } satisfies Entry, {
    ttlSeconds: TTL_S,
  });
  return true;
}

export async function readLoginToken(token: string): Promise<Entry | null> {
  const e = await readJSON<Entry | null>(keyFor(token), null);
  if (!e) return null;
  if (Date.now() - e.at > TTL_MS) return null; // просрочен
  return e;
}

export async function consumeLoginToken(token: string): Promise<void> {
  await deleteKey(keyFor(token));
}
