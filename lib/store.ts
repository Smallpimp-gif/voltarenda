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
  put(key: string, value: string): Promise<void>;
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

export async function writeJSON(key: string, value: unknown): Promise<void> {
  const kv = await cfKv();
  if (kv) {
    await kv.put(key, JSON.stringify(value));
    return;
  }
  const p = filePath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
  await fs.rename(tmp, p);
}
