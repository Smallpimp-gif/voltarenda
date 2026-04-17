// POST /api/apply/submit
//
// Принимает полную заявку на аренду: тариф, контакты, паспортные данные,
// fileId загруженных фото. Сохраняет в ./data/applications/{id}.json.
//
// В production: заменить на БД (PostgreSQL/Supabase) + шифрование ПДн.

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

type SubmitBody = {
  tariff: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  // Паспортные данные НЕ собираются — оператор вводит с фото
  photoMainId: string;
  photoRegistrationId: string;
  photoSelfieId: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "applications");

const ALLOWED_ORIGINS = [
  "https://voltarenda.ru",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://localhost:3099"]
    : []),
];

const VALID_TARIFFS = ["three-day", "week", "month", "buyout"];

export async function POST(req: Request) {
  // CSRF
  const origin = req.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400 },
    );
  }

  // Валидация
  const errors: string[] = [];
  if (!body.tariff || !VALID_TARIFFS.includes(body.tariff)) errors.push("Неизвестный тариф");
  if (!body.firstName || body.firstName.trim().length < 2) errors.push("Укажи имя");
  if (!body.lastName || body.lastName.trim().length < 2) errors.push("Укажи фамилию");
  if (!body.phone || body.phone.replace(/\D/g, "").length < 10) errors.push("Некорректный телефон");
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push("Некорректный email");
  if (!body.photoMainId) errors.push("Фото паспорта не загружено");
  if (!body.photoRegistrationId) errors.push("Фото прописки не загружено");
  if (!body.photoSelfieId) errors.push("Селфи не загружено");

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "validation", errors },
      { status: 400 },
    );
  }

  try {
    await mkdir(DATA_DIR, { recursive: true });

    const applicationId = crypto.randomUUID();
    const application = {
      id: applicationId,
      createdAt: new Date().toISOString(),
      status: "pending",
      tariff: body.tariff,
      customer: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        phone: body.phone,
        email: body.email.toLowerCase().trim(),
      },
      // Паспортные данные вводит оператор с фото
      photos: {
        main: body.photoMainId,
        registration: body.photoRegistrationId,
        selfie: body.photoSelfieId,
      },
    };

    const filepath = path.join(DATA_DIR, `${applicationId}.json`);
    await writeFile(filepath, JSON.stringify(application, null, 2), "utf-8");

    return NextResponse.json({
      id: applicationId,
      status: "pending",
      message: "Заявка принята. Оператор перезвонит в течение 15 минут.",
    });
  } catch (err) {
    console.error("[apply/submit] Error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Не удалось сохранить заявку" },
      { status: 500 },
    );
  }
}
