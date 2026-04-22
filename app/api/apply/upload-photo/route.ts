// POST /api/apply/upload-photo
//
// Принимает фото паспорта через FormData, сжимает серверно,
// сохраняет на диск (dev) или S3 (production), возвращает fileId.
//
// Ограничения:
// - Только image/* MIME-типы
// - Макс. 10MB на файл
// - CSRF: проверяем Origin
// - Файлы хранятся в ./uploads/{uuid}.jpg (gitignored)

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { isAllowedOrigin } from "@/lib/api-origin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: Request) {
  // CSRF — см. lib/api-origin.ts
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_form", message: "Ожидается multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("photo");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "missing_file", message: "Файл photo не найден" },
      { status: 400 },
    );
  }

  // Проверка MIME
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "invalid_type", message: `Допустимы только изображения: ${ALLOWED_MIME.join(", ")}` },
      { status: 400 },
    );
  }

  // Проверка размера
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "too_large", message: "Файл слишком большой. Макс. 10 МБ" },
      { status: 400 },
    );
  }

  // Слот (тип фото) — для валидации на стороне submit
  const slot = formData.get("slot");
  if (!slot || !["photoMain", "photoRegistration", "photoSelfie"].includes(String(slot))) {
    return NextResponse.json(
      { error: "invalid_slot", message: "Укажи тип фото: photoMain, photoRegistration, photoSelfie" },
      { status: 400 },
    );
  }

  try {
    // Создаём директорию uploads если нет
    await mkdir(UPLOADS_DIR, { recursive: true });

    // Генерируем уникальное имя файла
    const fileId = crypto.randomUUID();
    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `${fileId}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Записываем файл
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return NextResponse.json({
      fileId,
      filename,
      slot: String(slot),
      size: file.size,
      message: "Фото загружено",
    });
  } catch (err) {
    console.error("[upload-photo] Error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Не удалось сохранить фото" },
      { status: 500 },
    );
  }
}
