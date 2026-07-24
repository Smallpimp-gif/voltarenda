// Подписки на автосписание — через lib/store (ключ "bot/subscriptions").
// По каждому арендатору: id подписки в CloudPayments, последние 4 цифры
// карты и статус. Номер карты у нас НЕ хранится и не проходит через сервер —
// его забирает виджет CloudPayments, нам возвращается только токен.

import { readJSON, writeJSON } from "@/lib/store";

export type Subscription = {
  subscriptionId: string;
  cardLastFour?: string;
  cardType?: string; // Visa / MasterCard / МИР
  weekly: number; // сумма списания, ₽
  mode: "rent" | "buyout";
  maxPeriods: number; // сколько всего списаний (аренда — 52, продлеваем)
  status: "active" | "cancelled";
  createdAt: string;
  cancelledAt?: string;
};

type File = Record<string, Subscription>;
const KEY = "bot/subscriptions";

export async function getSubscription(tenantId: string): Promise<Subscription | null> {
  const data = await readJSON<File>(KEY, {});
  return data[tenantId] ?? null;
}

export async function saveSubscription(
  tenantId: string,
  sub: Omit<Subscription, "createdAt" | "status"> & Partial<Pick<Subscription, "status">>,
): Promise<void> {
  const data = await readJSON<File>(KEY, {});
  data[tenantId] = {
    ...sub,
    status: sub.status ?? "active",
    createdAt: data[tenantId]?.createdAt ?? new Date().toISOString(),
  };
  await writeJSON(KEY, data);
}

export async function cancelSubscription(tenantId: string): Promise<Subscription | null> {
  const data = await readJSON<File>(KEY, {});
  const cur = data[tenantId];
  if (!cur) return null;
  data[tenantId] = { ...cur, status: "cancelled", cancelledAt: new Date().toISOString() };
  await writeJSON(KEY, data);
  return data[tenantId];
}
