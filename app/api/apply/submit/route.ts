// POST /api/apply/submit
//
// Принимает полную заявку на аренду: тариф, контакты, паспортные данные,
// fileId загруженных фото. Сохраняет в ./data/applications/{id}.json.
//
// В production: заменить на БД (PostgreSQL/Supabase) + шифрование ПДн.

import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  formatApplicationNotification,
  notifyOperator,
  sendDocumentToOperator,
} from "@/lib/notify";
import { isAllowedOrigin } from "@/lib/api-origin";
import { writeJSON } from "@/lib/store";
import { nextContractNumber } from "@/lib/contract-number";
import { generateContractBlob } from "@/lib/contract";

export const runtime = "nodejs";

type Passport = {
  series?: string;
  number?: string;
  birthDate?: string;
  birthPlace?: string;
  issueDate?: string;
  departmentCode?: string;
  issuedBy?: string;
};

type SubmitBody = {
  tariff: string;
  bikeModel?: string;
  battery?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email: string;
  telegram?: string;
  regAddress?: string;
  currentAddress: string;
  // Паспортные данные авто-распознаются на клиенте (Yandex Vision),
  // пользователь проверяет; оператор сверяет с фото.
  passport?: Passport;
  photoMainId: string;
  photoRegistrationId: string;
  photoSelfieId: string;
};

const VALID_TARIFFS = ["three-day", "week", "month", "buyout"];

// Серверный источник истины для human-read имён + цен.
// Клиентский body не доверяем (подмена через DevTools).
const TARIFF_META: Record<string, { name: string; price: number }> = {
  "three-day": { name: "3 дня", price: 3500 },
  week: { name: "Неделя", price: 5500 },
  month: { name: "Месяц", price: 19000 },
  buyout: { name: "Выкуп · Неделя × 26", price: 6500 },
};

export async function POST(req: Request) {
  // CSRF
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
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
  if (!body.currentAddress || body.currentAddress.trim().length < 5) errors.push("Укажи актуальное место проживания");
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
    const applicationId = crypto.randomUUID();
    const application = {
      id: applicationId,
      createdAt: new Date().toISOString(),
      status: "pending",
      tariff: body.tariff,
      bike: {
        model: body.bikeModel ?? "",
        battery: body.battery ?? "",
      },
      customer: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        middleName: body.middleName?.trim() ?? "",
        phone: body.phone,
        email: body.email.toLowerCase().trim(),
        telegram: (body.telegram ?? "").trim().replace(/^@/, ""),
        regAddress: (body.regAddress ?? "").trim(),
        currentAddress: body.currentAddress.trim(),
      },
      // Паспортные данные авто-распознаны на клиенте, проверены пользователем.
      passport: body.passport ?? {},
      photos: {
        main: body.photoMainId,
        registration: body.photoRegistrationId,
        selfie: body.photoSelfieId,
      },
    };

    await writeJSON(`applications/${applicationId}`, application);

    // Fire-and-forget уведомление оператору в Telegram. Если бот не
    // настроен (нет env) или сеть упала — submit всё равно считается
    // успешным, заявка лежит на диске. Await тут чтобы лог ошибок
    // попал в тот же request, но оператор получит мгновенно.
    const tariffMeta = TARIFF_META[body.tariff];
    await notifyOperator(
      formatApplicationNotification({
        id: applicationId,
        tariff: body.tariff,
        tariffName: tariffMeta.name,
        tariffPrice: tariffMeta.price,
        bikeModel: application.bike.model,
        battery: application.bike.battery,
        firstName: application.customer.firstName,
        lastName: application.customer.lastName,
        middleName: application.customer.middleName,
        phone: application.customer.phone,
        email: application.customer.email,
        telegram: application.customer.telegram,
        currentAddress: application.customer.currentAddress,
        passport: application.passport,
        photoCount: 3,
      }),
    );

    // Авто-договор аренды (.docx) → оператору в Telegram. Best-effort:
    // ошибка генерации не валит заявку.
    try {
      const number = await nextContractNumber();
      const dp = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Moscow",
      }).formatToParts(new Date());
      const part = (type: string) => dp.find((p) => p.type === type)?.value ?? "";
      const dateText = `«${part("day")}» ${part("month")} ${part("year")} г.`;
      const fio = [
        application.customer.lastName,
        application.customer.firstName,
        application.customer.middleName,
      ]
        .filter(Boolean)
        .join(" ");
      const blob = await generateContractBlob({
        number,
        dateText,
        tenant: {
          fio,
          birthDate: application.passport.birthDate,
          birthPlace: application.passport.birthPlace,
          passportSeries: application.passport.series,
          passportNumber: application.passport.number,
          issuedBy: application.passport.issuedBy,
          issueDate: application.passport.issueDate,
          departmentCode: application.passport.departmentCode,
          regAddress: application.customer.regAddress,
          factAddress: application.customer.currentAddress,
          phone: application.customer.phone,
          telegram: application.customer.telegram,
        },
      });
      const safeFio = fio.replace(/[^\p{L}\d]+/gu, "_");
      await sendDocumentToOperator(
        blob,
        `Договор_№${number}_${safeFio}.docx`,
        `📄 Договор №${number} · ${fio}`,
      );
    } catch (e) {
      console.error("[apply/submit] contract gen failed:", e);
    }

    return NextResponse.json({
      id: applicationId,
      status: "pending",
      message: "Заявка принята. Оператор напишет в Telegram в течение 15 минут.",
    });
  } catch (err) {
    console.error("[apply/submit] Error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Не удалось сохранить заявку" },
      { status: 500 },
    );
  }
}
