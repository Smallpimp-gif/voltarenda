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
import {
  getBuyoutConfig,
  getBuyoutPlan,
  rentWeekly,
  batteryContractLine,
  DEFAULT_BUYOUT_CONFIG,
} from "@/lib/bikes";

export const runtime = "nodejs";

type CreateSubscriptionBody = {
  token: string; // Token карты из виджета CloudPayments
  // Условия сделки — те же ключи, что в форме заявки и договоре.
  mode?: "rent" | "buyout";
  buyoutConfig?: string;
  buyoutWeeks?: number;
  tariff?: {
    key: string;
    name: string;
    price: number; // цена от клиента — НЕ доверяем, только для логов
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
// Цена берётся из ЕДИНОГО каталога (lib/bikes.ts) — того же, по которому
// считает лендинг, форма заявки и генерируется договор. Отдельного
// прайса здесь нет намеренно: иначе списания разъедутся с договором.
function resolveTerms(body: CreateSubscriptionBody) {
  const cfg = getBuyoutConfig(body.buyoutConfig) ?? getBuyoutConfig(DEFAULT_BUYOUT_CONFIG)!;
  const isBuyout = body.mode !== "rent";
  const plan = getBuyoutPlan(cfg, body.buyoutWeeks);
  return {
    cfg,
    isBuyout,
    // Оба типа списываются понедельно.
    weekly: isBuyout ? plan.weekly : rentWeekly(cfg),
    // Выкуп — конечное число списаний; аренда — бессрочно (год вперёд).
    recurrence: {
      interval: "Week" as const,
      period: 1,
      maxPeriods: isBuyout ? plan.weeks : 52,
    },
  };
}

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

  if (!body.token) {
    return NextResponse.json(
      { error: "missing_fields", message: "Не указан token" },
      { status: 400 },
    );
  }

  // Цена считается на сервере из каталога — клиентскую не читаем вообще.
  const { cfg, isBuyout, weekly: trustedPrice, recurrence } = resolveTerms(body);
  const dealName = isBuyout
    ? `выкуп, ${recurrence.maxPeriods} нед`
    : "аренда, понедельно";

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
    return NextResponse.json({
      mode: "mock",
      subscription: {
        id: `mock-sub-${Date.now()}`,
        amount: trustedPrice,
        interval: recurrence.interval,
        period: recurrence.period,
        maxPeriods: recurrence.maxPeriods,
        status: "Active",
      },
      message: `Mock: ${dealName} — ${trustedPrice} ₽ каждую неделю, макс ${recurrence.maxPeriods} списаний`,
    });
  }

  // ============================================================
  // Реальный CloudPayments API
  // ============================================================
  const auth = Buffer.from(`${publicId}:${apiSecret}`).toString("base64");

  // Создаём подписку через CloudPayments API
  // https://developers.cloudpayments.ru/en/#create-subscription
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // первое рекуррентное — через неделю

  const payload = {
    token: body.token,
    accountId: body.customer.email || body.customer.phone,
    description: `${cfg.model}, ${batteryContractLine(cfg)} — ${dealName}`,
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
