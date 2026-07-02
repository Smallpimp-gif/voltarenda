// Учёт оплат — через lib/store (ключ "bot/payments"). По каждому арендатору
// «оплачено до платежа N» (paidThrough) + частично внесено за текущую неделю
// (partialPaid, ₽). Источник истины — владелец (отмечает в кабинете). Async.

import { readJSON, writeJSON } from "@/lib/store";

type PaymentRec = {
  paidThrough: number;
  partialPaid?: number;
  referralWeeks?: number; // недель зачтено за приведённых друзей (без денег)
  updatedAt: string;
};
type PaymentsFile = Record<string, PaymentRec>;

export type Payment = { paidThrough: number; partialPaid: number; referralWeeks: number };

const KEY = "bot/payments";

export async function getPaidThrough(tenantId: string): Promise<number> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  return data[tenantId]?.paidThrough ?? 0;
}

export async function getPayment(tenantId: string): Promise<Payment> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  const r = data[tenantId];
  return {
    paidThrough: r?.paidThrough ?? 0,
    partialPaid: r?.partialPaid ?? 0,
    referralWeeks: r?.referralWeeks ?? 0,
  };
}

// Карта paidThrough (для совместимости — там, где частичное не нужно).
export async function loadPaidMap(): Promise<Record<string, number>> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(data)) out[id] = v.paidThrough;
  return out;
}

// Полная карта: paidThrough + partialPaid по каждому арендатору.
export async function loadPaymentMap(): Promise<Record<string, Payment>> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  const out: Record<string, Payment> = {};
  for (const [id, v] of Object.entries(data)) {
    out[id] = {
      paidThrough: v.paidThrough,
      partialPaid: v.partialPaid ?? 0,
      referralWeeks: v.referralWeeks ?? 0,
    };
  }
  return out;
}

export async function setPaidThrough(tenantId: string, n: number): Promise<void> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  data[tenantId] = {
    ...data[tenantId],
    paidThrough: Math.max(0, Math.floor(n)),
    updatedAt: new Date().toISOString(),
  };
  await writeJSON(KEY, data);
}

export async function setPayment(
  tenantId: string,
  p: { paidThrough: number; partialPaid: number; referralWeeks?: number },
): Promise<void> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  data[tenantId] = {
    paidThrough: Math.max(0, Math.floor(p.paidThrough)),
    partialPaid: Math.max(0, Math.round(p.partialPaid * 100) / 100),
    referralWeeks: Math.max(0, Math.floor(p.referralWeeks ?? data[tenantId]?.referralWeeks ?? 0)),
    updatedAt: new Date().toISOString(),
  };
  await writeJSON(KEY, data);
}
