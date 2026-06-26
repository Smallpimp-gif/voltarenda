// Единое JSON-хранилище. На Vercel (serverless, эфемерный диск) — Vercel KV
// (persistent, Upstash Redis под капотом). Локально — файлы data/<key>.json,
// как раньше. Режим определяется по env: есть KV_REST_API_URL → KV.
//
// Ключ = путь без расширения: "auth/users", "auth/sessions",
// "site/settings", "bot/payments", "bot/tenants", "applications/<id>".
//
// Всё асинхронно (KV — сетевой вызов). Поэтому модули хранилища и их
// вызовы — async.

import { promises as fs } from "node:fs";
import path from "node:path";

const useKV = Boolean(process.env.KV_REST_API_URL);

async function kvClient() {
  const mod = await import("@vercel/kv");
  return mod.kv;
}

function filePath(key: string): string {
  return path.join(process.cwd(), "data", `${key}.json`);
}

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  if (useKV) {
    const kv = await kvClient();
    const v = await kv.get<T>(key);
    return v ?? fallback;
  }
  try {
    return JSON.parse(await fs.readFile(filePath(key), "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  if (useKV) {
    const kv = await kvClient();
    await kv.set(key, value);
    return;
  }
  const p = filePath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
  await fs.rename(tmp, p); // атомарно на той же ФС
}
