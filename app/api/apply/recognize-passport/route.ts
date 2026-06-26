// POST /api/apply/recognize-passport
//
// Принимает { fileId } уже загруженного фото главного разворота паспорта
// (см. /api/apply/upload-photo) и возвращает распознанные поля через
// Yandex Vision OCR (lib/passport-ocr.ts). Если OCR не настроен (нет
// ключей) — { configured: false }, форма перейдёт в ручной ввод.

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { isAllowedOrigin } from "@/lib/api-origin";
import { recognizePassport } from "@/lib/passport-ocr";

export const runtime = "nodejs";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: Request) {
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { fileId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const fileId = body.fileId;
  // UUID-формат — заодно защита от path traversal.
  if (!fileId || !/^[a-f0-9-]{36}$/i.test(fileId)) {
    return NextResponse.json({ error: "invalid_file_id" }, { status: 400 });
  }

  // Файл сохранён как {fileId}.jpg или .png — пробуем оба.
  let buffer: Buffer | null = null;
  let mime = "image/jpeg";
  for (const ext of ["jpg", "png"] as const) {
    try {
      buffer = await readFile(path.join(UPLOADS_DIR, `${fileId}.${ext}`));
      mime = ext === "png" ? "image/png" : "image/jpeg";
      break;
    } catch {
      /* пробуем следующее расширение */
    }
  }
  if (!buffer) {
    return NextResponse.json({ error: "file_not_found" }, { status: 404 });
  }

  const result = await recognizePassport(buffer, mime);
  return NextResponse.json(result);
}
