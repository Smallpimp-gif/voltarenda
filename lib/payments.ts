// Учёт оплат — через lib/store (ключ "bot/payments"). По каждому арендатору
// «оплачено до платежа N» (paidThrough). Источник истины — владелец (отмечает
// в кабинете). Async (KV сетевой).

import { readJSON, writeJSON } from "@/lib/store";

type PaymentsFile = Record<string, { paidThrough: number; updatedAt: string }>;

const KEY = "bot/payments";

export async function getPaidThrough(tenantId: string): Promise<number> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  return data[tenantId]?.paidThrough ?? 0;
}

export async function loadPaidMap(): Promise<Record<string, number>> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(data)) out[id] = v.paidThrough;
  return out;
}

export async function setPaidThrough(tenantId: string, n: number): Promise<void> {
  const data = await readJSON<PaymentsFile>(KEY, {});
  data[tenantId] = {
    paidThrough: Math.max(0, Math.floor(n)),
    updatedAt: new Date().toISOString(),
  };
  await writeJSON(KEY, data);
}
