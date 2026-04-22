// POST /api/cloudpayments/create-subscription
//
// Создаёт подписку (рекуррентные еженедельные списания) в CloudPayments
// после успешного первого платежа через виджет. Виджет сам обрабатывает
// карту, 3DS, и возвращает Token — мы используем его для подписки.
//
// Если ключи CloudPayments не заданы — mock-режим (как было с YuKassa).
//
// Env:
//   CLOUDPAYMENTS_PUBLIC_ID  — Public ID из ЛК CloudPayments
//   CLOUDPAYMENTS_API_SECRET — API Secret из ЛК CloudPayments

import { NextResponse } from "next/server";
import { isAllowedOrigin } from "@/lib/api-origin";

export const runtime = "nodejs";

type CreateSubscriptionBody = {
  token: string; // Token карты из виджета CloudPayments
  tariff: {
    key: string;
    name: string;
    price: number; // цена за период в рублях
  };
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  metadata?: Record<string, unknown>;
};

// ============================================================
// СЕРВЕРНЫЙ ИСТОЧНИК ИСТИНЫ ДЛЯ ЦЕН
// Клиент присылает tariff.key — сервер ищет цену ЗДЕСЬ,
// а НЕ доверяет клиентскому tariff.price. Это защита от
// подмены цены через DevTools / curl.
// ============================================================
const TARIFF_PRICES: Record<string, number> = {
  "three-day": 3500,
  week: 5500,
  month: 19000,
  buyout: 6500,
};

const DEPOSIT_RUB = 5000;

const TARIFF_RECURRENCE: Record<
  string,
  { interval: "Day" | "Week" | "Month"; period: number; maxPeriods: number } | null
> = {
  "three-day": null,
  week: { interval: "Week", period: 1, maxPeriods: 52 },
  month: { interval: "Month", period: 1, maxPeriods: 12 },
  buyout: { interval: "Week", period: 1, maxPeriods: 26 },
};

export async function POST(req: Request) {
  // CSRF: проверяем Origin header — только наш домен может вызывать API.
  // См. lib/api-origin.ts: prod = https://voltarenda.ru, dev = любой localhost:*.
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { error: "forbidden", message: "Недопустимый источник запроса" },
      { status: 403 },
    );
  }

  let body: CreateSubscriptionBody;
  try {
    body = (await req.json()) as CreateSubscriptionBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Некорректный JSON" },
      { status: 400 },
    );
  }

  if (!body.token || !body.tariff?.key) {
    return NextResponse.json(
      { error: "missing_fields", message: "Не указан token или тариф" },
      { status: 400 },
    );
  }

  // Серверный lookup цены — НИКОГДА не доверяем body.tariff.price
  const trustedPrice = TARIFF_PRICES[body.tariff.key];
  if (trustedPrice === undefined) {
    return NextResponse.json(
      { error: "invalid_tariff", message: `Неизвестный тариф: ${body.tariff.key}` },
      { status: 400 },
    );
  }

  const publicId = process.env.CLOUDPAYMENTS_PUBLIC_ID;
  const apiSecret = process.env.CLOUDPAYMENTS_API_SECRET;

  // ============================================================
  // Mock-режим: ключи не заданы. В production — ОШИБКА, не тихий mock.
  // ============================================================
  if (!publicId || !apiSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "config_error", message: "Платёжная система не настроена" },
        { status: 503 },
      );
    }
    const recurrence = TARIFF_RECURRENCE[body.tariff.key];
    return NextResponse.json({
      mode: "mock",
      subscription: recurrence
        ? {
            id: `mock-sub-${Date.now()}`,
            amount: trustedPrice,
            interval: recurrence.interval,
            period: recurrence.period,
            maxPeriods: recurrence.maxPeriods,
            status: "Active",
          }
        : null,
      message: recurrence
        ? `Mock: подписка ${trustedPrice} ₽ каждую ${recurrence.interval === "Week" ? "неделю" : "месяц"}, макс ${recurrence.maxPeriods} списаний`
        : `Mock: разовый платёж ${trustedPrice + DEPOSIT_RUB} ₽, подписка не требуется`,
    });
  }

  // ============================================================
  // Реальный CloudPayments API
  // ============================================================
  const auth = Buffer.from(`${publicId}:${apiSecret}`).toString("base64");
  const recurrence = TARIFF_RECURRENCE[body.tariff.key];

  // Если тариф без рекуррента (3 дня) — подписку не создаём
  if (!recurrence) {
    return NextResponse.json({
      mode: "live",
      subscription: null,
      message: "Тариф без подписки, первый платёж обработан виджетом",
    });
  }

  // Создаём подписку через CloudPayments API
  // https://developers.cloudpayments.ru/en/#create-subscription
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + (recurrence.interval === "Week" ? 7 : 30));

  const payload = {
    token: body.token,
    accountId: body.customer.email || body.customer.phone,
    description: `Аренда ВОЛЬТ U2 · тариф ${body.tariff.name}`,
    email: body.customer.email,
    amount: trustedPrice,
    currency: "RUB",
    requireConfirmation: false,
    startDate: startDate.toISOString(),
    interval: recurrence.interval,
    period: recurrence.period,
    maxPeriods: recurrence.maxPeriods,
  };

  try {
    const res = await fetch(
      "https://api.cloudpayments.ru/subscriptions/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();

    if (!data.Success) {
      // НЕ отдаём details клиенту — может содержать внутренние коды CP
      console.error("[CloudPayments] Subscription error:", JSON.stringify(data));
      return NextResponse.json(
        {
          error: "cloudpayments_error",
          message: "Не удалось создать подписку. Попробуйте позже.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      mode: "live",
      subscription: {
        id: data.Model?.Id,
        amount: data.Model?.Amount,
        interval: data.Model?.Interval,
        period: data.Model?.Period,
        maxPeriods: recurrence.maxPeriods,
        status: data.Model?.Status,
        startDate: data.Model?.StartDateIso,
      },
    });
  } catch (err) {
    console.error("[CloudPayments] Network error:", err);
    return NextResponse.json(
      { error: "network_error", message: "Сервис оплаты недоступен. Попробуйте позже." },
      { status: 502 },
    );
  }
}
