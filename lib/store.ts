// Единое JSON-хранилище. На Cloudflare Workers — Cloudflare KV (binding
// DATA, persistent). Локально (next dev) — файлы data/<key>.json.
// Режим определяется наличием Cloudflare-контекста.
//
// Ключ = путь без расширения: "auth/users", "auth/sessions",
// "site/settings", "bot/payments", "bot/tenants", "applications/<id>".

import { promises as fs } from "node:fs";
import path from "node:path";

// Минимальный структурный тип KV-биндинга (без @cloudflare/workers-types).
type KV = {
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
};

async function cfKv(): Promise<KV | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const kv = (ctx?.env as Record<string, unknown> | undefined)?.DATA;
    return (kv as KV) ?? null;
  } catch {
    return null; // не в Cloudflare (локальный next dev) → файлы
  }
}

function filePath(key: string): string {
  return path.join(process.cwd(), "data", `${key}.json`);
}

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const kv = await cfKv();
  if (kv) {
    const v = await kv.get<T>(key, "json");
    return v ?? fallback;
  }
  try {
    return JSON.parse(await fs.readFile(filePath(key), "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJSON(
  key: string,
  value: unknown,
  options?: { ttlSeconds?: number },
): Promise<void> {
  const kv = await cfKv();
  if (kv) {
    // KV требует expirationTtl >= 60. Меньше — просто без TTL.
    const ttl = options?.ttlSeconds && options.ttlSeconds >= 60 ? options.ttlSeconds : undefined;
    await kv.put(key, JSON.stringify(value), ttl ? { expirationTtl: ttl } : undefined);
    return;
  }
  const p = filePath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
  await fs.rename(tmp, p);
}

export async function deleteKey(key: string): Promise<void> {
  const kv = await cfKv();
  if (kv) {
    await kv.delete(key);
    return;
  }
  try {
    await fs.unlink(filePath(key));
  } catch {
    /* нет файла — ок */
  }
}
