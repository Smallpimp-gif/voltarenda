// POST /api/apply/recognize-passport
//
// Принимает { fileId } уже загруженного фото главного разворота паспорта
// (см. /api/apply/upload-photo) и возвращает распознанные поля через
// Yandex Vision OCR (lib/passport-ocr.ts). Если OCR не настроен — { configured: false }.

import { NextResponse } from "next/server";
import { isAllowedOrigin } from "@/lib/api-origin";
import { readPhoto } from "@/lib/blob";
import { recognizePassport } from "@/lib/passport-ocr";

export const runtime = "nodejs";

// fileId — либо Blob-URL (https), либо uuid (локальный режим). Защита от
// path traversal: ничего, кроме этих двух форм, не принимаем.
const UUID_RE = /^[a-f0-9-]{36}$/i;

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

  const fileId = String(body.fileId ?? "");
  const isBlobUrl = /^https:\/\/[^\s]+$/.test(fileId);
  if (!fileId || (!isBlobUrl && !UUID_RE.test(fileId))) {
    return NextResponse.json({ error: "invalid_file_id" }, { status: 400 });
  }

  const photo = await readPhoto(fileId);
  if (!photo) {
    return NextResponse.json({ error: "file_not_found" }, { status: 404 });
  }

  const result = await recognizePassport(photo.buffer, photo.mime);
  return NextResponse.json(result);
}
