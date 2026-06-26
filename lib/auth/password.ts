// Хеширование паролей через встроенный node:crypto scrypt — без внешних
// зависимостей (важно: прод в РФ, исходящие соединения к auth-сервисам не
// нужны и блокировка входящих не мешает). scrypt — memory-hard, рекомендован
// OWASP. Формат хранения: "scrypt$<saltHex>$<hashHex>".

import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KEYLEN = 64;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;
  // timingSafeEqual требует одинаковой длины — expected.length задаёт keylen.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
