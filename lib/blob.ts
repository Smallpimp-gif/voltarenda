// Хранилище фото (паспорт/прописка/селфи). На Vercel — Vercel Blob
// (persistent), локально — папка uploads/. Возвращает opaque-ref:
// в blob-режиме это URL, локально — uuid.
//
// ВНИМАНИЕ (ПДн): Vercel Blob отдаёт публичные URL (со случайным суффиксом —
// «неугадываемые», но технически публичные). Для боевых паспортных данных
// нужно приватное хранилище / подписанные ссылки. Сейчас это MVP-компромисс,
// как и хранение ПДн в JSON (тот же известный риск).

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const UPLOADS = path.join(process.cwd(), "uploads");

function extFor(contentType: string): "png" | "jpg" {
  return contentType.includes("png") ? "png" : "jpg";
}

export async function savePhoto(buffer: Buffer, contentType: string): Promise<string> {
  const ext = extFor(contentType);
  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`photos/${randomUUID()}.${ext}`, buffer, {
      access: "public",
      contentType,
    });
    return url;
  }
  const id = randomUUID();
  await fs.mkdir(UPLOADS, { recursive: true });
  await fs.writeFile(path.join(UPLOADS, `${id}.${ext}`), buffer);
  return id;
}

export async function readPhoto(ref: string): Promise<{ buffer: Buffer; mime: string } | null> {
  if (/^https?:\/\//.test(ref)) {
    try {
      const res = await fetch(ref);
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, mime: res.headers.get("content-type") || "image/jpeg" };
    } catch {
      return null;
    }
  }
  // Локальный режим: ref = uuid, файл uploads/{uuid}.{jpg|png}
  for (const ext of ["jpg", "png"] as const) {
    try {
      const buffer = await fs.readFile(path.join(UPLOADS, `${ref}.${ext}`));
      return { buffer, mime: ext === "png" ? "image/png" : "image/jpeg" };
    } catch {
      /* пробуем следующее */
    }
  }
  return null;
}
