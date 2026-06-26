// Хеширование паролей через Web Crypto (PBKDF2-SHA256). Работает одинаково
// в Node (next dev) и в Cloudflare Workers — там node:crypto scrypt
// недоступен. Формат хранения: "pbkdf2$<iters>$<saltHex>$<hashHex>".
//
// Итерации: 100k — баланс между стойкостью (OWASP) и лимитом CPU воркера.
// Логин редкий, так что это приемлемо.

const ITERATIONS = 100_000;
const KEYLEN = 32; // байт
const SALT_BYTES = 16;

const enc = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
  lenBytes: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    lenBytes * 8,
  );
  return new Uint8Array(bits);
}

// Сравнение за константное время (timingSafeEqual в воркере нет).
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await deriveBits(password, salt, ITERATIONS, KEYLEN);
  return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const salt = fromHex(parts[2]);
  const expected = fromHex(parts[3]);
  const derived = await deriveBits(password, salt, iterations, expected.length);
  return constantTimeEqual(derived, expected);
}
