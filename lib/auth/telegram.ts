// Проверка подписи Telegram WebApp (Mini App) initData.
// Telegram отдаёт фронту строку initData с HMAC-подписью бот-токеном.
// Проверяем подпись на сервере → доверенная личность Telegram-юзера.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// Dev-мок: TG_MOCK='{"id":123,"first_name":"Иван"}' возвращает юзера без
// сети/подписи — чтобы прогнать роутинг Mini App локально (вне Telegram
// initData недоступен).

import { createHmac, timingSafeEqual } from "node:crypto";

export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

const MAX_AGE_SEC = 24 * 60 * 60; // initData не старше суток

export function verifyInitData(initData: string): TgUser | null {
  const mock = process.env.TG_MOCK;
  if (mock) {
    try {
      return JSON.parse(mock) as TgUser;
    } catch {
      return null;
    }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  // data_check_string: пары key=value, отсортированы по ключу, через \n.
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => [k, v] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  // timing-safe сравнение
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Свежесть
  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SEC) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;
  try {
    const u = JSON.parse(userRaw);
    if (typeof u?.id !== "number") return null;
    return {
      id: u.id,
      first_name: String(u.first_name ?? ""),
      last_name: u.last_name ? String(u.last_name) : undefined,
      username: u.username ? String(u.username) : undefined,
    };
  } catch {
    return null;
  }
}
