// Клиент интернет-эквайринга Точки (СБП + карты) для приёма оплат аренды.
// Гейтится секретами: без TOCHKA_JWT_TOKEN всё «спит» (tochkaEnabled() → false),
// сайт работает как раньше.
//
// ⚠️ Точные форматы тела запроса/ответа Точки собраны по докам
// (developers.tochka.com, acquiring v1.0). Их нужно выверить на проверочной
// оплате 1 ₽ — вся Точка-специфика собрана здесь, правка в одном месте.

const BASE = "https://enter.tochka.com/uapi";

type Cfg = {
  token: string;
  customerCode: string;
  merchantId: string;
  taxSystem: string; // система налогообложения для чека (напр. usn_income)
  vatType: string; // ставка НДС позиции (напр. none — без НДС на УСН)
};

function cfg(): Cfg | null {
  const token = process.env.TOCHKA_JWT_TOKEN;
  const customerCode = process.env.TOCHKA_CUSTOMER_CODE;
  const merchantId = process.env.TOCHKA_MERCHANT_ID;
  if (!token || !customerCode || !merchantId) return null;
  return {
    token,
    customerCode,
    merchantId,
    taxSystem: process.env.TOCHKA_TAX_SYSTEM || "usn_income",
    vatType: process.env.TOCHKA_VAT_TYPE || "none",
  };
}

// Настроена ли Точка (есть ли все секреты). По этому флагу показываем кнопку.
export function tochkaEnabled(): boolean {
  return cfg() !== null;
}

async function call<T>(
  c: Cfg,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${c.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      // не кэшировать платёжные вызовы
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[tochka] HTTP", res.status, path, await res.text().catch(() => ""));
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error("[tochka] fetch error", path, e);
    return null;
  }
}

export type CreatedPayment = { operationId: string; paymentLink: string };

// Создать платёжную ссылку с чеком (54-ФЗ). paymentMode: СБП + карта.
export async function createPaymentLink(input: {
  amount: number; // ₽
  purpose: string; // назначение (видит плательщик)
  orderId: string; // наш уникальный id операции
  redirectUrl: string; // куда вернуть после оплаты
  failRedirectUrl?: string;
  itemName: string; // наименование в чеке («Аренда …»)
  client?: { email?: string; phone?: string }; // для чека
}): Promise<CreatedPayment | null> {
  const c = cfg();
  if (!c) return null;
  const amount = (Math.round(input.amount * 100) / 100).toFixed(2);
  const req = {
    Data: {
      customerCode: c.customerCode,
      merchantId: c.merchantId,
      amount,
      purpose: input.purpose,
      orderId: input.orderId,
      paymentMode: ["sbp", "card"],
      redirectUrl: input.redirectUrl,
      failRedirectUrl: input.failRedirectUrl ?? input.redirectUrl,
      preAuthorization: false,
      taxSystemCode: c.taxSystem,
      Client: {
        ...(input.client?.email ? { email: input.client.email } : {}),
        ...(input.client?.phone ? { phone: input.client.phone } : {}),
      },
      Items: [
        {
          name: input.itemName,
          amount,
          quantity: 1,
          measure: "шт",
          paymentMethod: "full_payment",
          paymentObject: "service",
          vatType: c.vatType,
        },
      ],
    },
  };
  const res = await call<{ Data?: Record<string, unknown> }>(
    c,
    "POST",
    "/acquiring/v1.0/payments_with_receipt",
    req,
  );
  const d = res?.Data;
  if (!d) return null;
  const paymentLink = (d.paymentLink ?? d.payment_link ?? d.url) as string | undefined;
  const operationId = (d.operationId ?? d.operation_id) as string | undefined;
  if (!paymentLink || !operationId) {
    console.error("[tochka] unexpected create response", d);
    return null;
  }
  return { operationId, paymentLink };
}

export type OperationStatus = "APPROVED" | "AUTHORIZED" | "EXPIRED" | "CREATED" | string;

// Статус операции по operationId. APPROVED = оплачено (деньги зачислены).
export async function getOperationStatus(operationId: string): Promise<OperationStatus | null> {
  const c = cfg();
  if (!c) return null;
  const res = await call<{ Data?: Record<string, unknown> }>(
    c,
    "GET",
    `/acquiring/v1.0/payments/${encodeURIComponent(operationId)}`,
  );
  const d = res?.Data as Record<string, unknown> | undefined;
  if (!d) return null;
  // Точка может отдавать либо объект операции, либо {Operation:[...]}.
  const op = Array.isArray(d.Operation) ? (d.Operation[0] as Record<string, unknown>) : d;
  const status = (op?.status ?? op?.state) as string | undefined;
  return status ?? null;
}
