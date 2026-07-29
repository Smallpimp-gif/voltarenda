// Ожидающие оплаты через Точку: связка нашего orderId ↔ арендатор/сумма/период
// и operationId Точки. Крон-воркер опрашивает статусы и по этим записям
// отмечает оплату. Хранится в KV (bot/tochka-pending).

import { readJSON, writeJSON } from "@/lib/store";

export type PendingPayment = {
  orderId: string; // наш уникальный id операции
  operationId: string; // id операции в Точке
  tenantId: string;
  name: string; // снимок фамилии
  amount: number; // ₽
  weeks: number; // сколько периодов закрывает (обычно 1)
  status: "pending" | "done";
  paymentLink: string;
  at: string; // ISO создания
};

type PendingFile = { items: PendingPayment[] };

const KEY = "bot/tochka-pending";
const EMPTY: PendingFile = { items: [] };

export async function loadPending(): Promise<PendingFile> {
  return { ...EMPTY, ...(await readJSON<Partial<PendingFile>>(KEY, {})) };
}

export async function addPending(p: Omit<PendingPayment, "status" | "at">): Promise<void> {
  const file = await loadPending();
  file.items.push({ ...p, status: "pending", at: new Date().toISOString() });
  // держим список компактным — не копим завершённые бесконечно
  file.items = file.items.slice(-200);
  await writeJSON(KEY, file);
}

export async function findByOrderId(orderId: string): Promise<PendingPayment | null> {
  const file = await loadPending();
  return file.items.find((x) => x.orderId === orderId) ?? null;
}

// Пометить оплату завершённой (идемпотентно). Возвращает false, если её нет
// или она уже отмечена — чтобы не начислить дважды.
export async function markPendingDone(orderId: string): Promise<boolean> {
  const file = await loadPending();
  const p = file.items.find((x) => x.orderId === orderId);
  if (!p || p.status === "done") return false;
  p.status = "done";
  await writeJSON(KEY, file);
  return true;
}
