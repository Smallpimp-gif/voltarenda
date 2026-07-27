// Закупки товара с поштучным учётом и расчётом прибыли. Отдельно от кассы
// аренды: закупка — это НЕ расход (деньги вернутся с продажей), а оборот.
//
// Модель: партия (Purchase) со списком продаж (Sale). Продавать можно частями
// (закупил 10 → продаёшь по 1–2). Себестоимость единицы = (кол-во×цена +
// доставка) / кол-во; прибыль считается только по проданным штукам, остаток
// показывает, сколько денег «висит» в непроданном товаре.

import { readJSON, writeJSON } from "@/lib/store";

export type Sale = {
  id: string;
  at: string; // ISO
  qty: number; // сколько штук продано этой операцией
  revenue: number; // выручка за эти штуки, ₽
  note?: string;
  ledgerId?: string; // связанная запись кассы (доход магазина), если есть
};

export type Purchase = {
  id: string;
  at: string; // ISO
  name: string; // что закупили
  qty: number; // закуплено штук
  unitCost: number; // цена закупки за штуку, ₽
  delivery: number; // доставка на всю партию, ₽
  sales: Sale[];
};

type PurchasesFile = { purchases: Purchase[] };

const KEY = "bot/purchases";
const EMPTY: PurchasesFile = { purchases: [] };

export async function loadPurchases(): Promise<PurchasesFile> {
  return { ...EMPTY, ...(await readJSON<Partial<PurchasesFile>>(KEY, {})) };
}

// --- Расчёты (чистые) --------------------------------------------------

export type PurchaseStats = {
  invested: number; // вложено = qty*unitCost + delivery
  costPerUnit: number; // себестоимость единицы (с учётом доставки)
  soldQty: number; // продано штук
  revenue: number; // выручка от проданного
  realizedCost: number; // себестоимость проданного
  profit: number; // прибыль = revenue − realizedCost
  remainingQty: number; // остаток на складе, штук
  tiedValue: number; // деньги в остатке (по себестоимости)
};

export function purchaseStats(p: Purchase): PurchaseStats {
  const invested = p.qty * p.unitCost + p.delivery;
  const costPerUnit = p.qty > 0 ? invested / p.qty : 0;
  const soldQty = p.sales.reduce((s, x) => s + x.qty, 0);
  const revenue = p.sales.reduce((s, x) => s + x.revenue, 0);
  const realizedCost = soldQty * costPerUnit;
  return {
    invested,
    costPerUnit,
    soldQty,
    revenue,
    realizedCost,
    profit: revenue - realizedCost,
    remainingQty: Math.max(0, p.qty - soldQty),
    tiedValue: Math.max(0, p.qty - soldQty) * costPerUnit,
  };
}

export type PurchasesSummary = {
  invested: number; // всего вложено
  revenue: number; // всего выручки
  profit: number; // реализованная прибыль
  tiedValue: number; // деньги в непроданном товаре
  itemsOnHand: number; // остаток штук всего
};

export function purchasesSummary(file: PurchasesFile): PurchasesSummary {
  return file.purchases.reduce<PurchasesSummary>(
    (acc, p) => {
      const s = purchaseStats(p);
      acc.invested += s.invested;
      acc.revenue += s.revenue;
      acc.profit += s.profit;
      acc.tiedValue += s.tiedValue;
      acc.itemsOnHand += s.remainingQty;
      return acc;
    },
    { invested: 0, revenue: 0, profit: 0, tiedValue: 0, itemsOnHand: 0 },
  );
}

// --- Мутации -----------------------------------------------------------

export async function addPurchase(input: {
  name: string;
  qty: number;
  unitCost: number;
  delivery: number;
}): Promise<void> {
  const file = await loadPurchases();
  file.purchases.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    name: input.name,
    qty: input.qty,
    unitCost: input.unitCost,
    delivery: input.delivery,
    sales: [],
  });
  await writeJSON(KEY, file);
}

// Продажа части остатка. Возвращает false, если партии нет или qty больше
// остатка (защита от продажи «в минус»).
export async function addSale(
  purchaseId: string,
  input: { qty: number; revenue: number; note?: string; ledgerId?: string },
): Promise<boolean> {
  const file = await loadPurchases();
  const p = file.purchases.find((x) => x.id === purchaseId);
  if (!p) return false;
  const { remainingQty } = purchaseStats(p);
  if (input.qty <= 0 || input.qty > remainingQty) return false;
  p.sales.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    qty: input.qty,
    revenue: input.revenue,
    note: input.note,
    ledgerId: input.ledgerId,
  });
  await writeJSON(KEY, file);
  return true;
}

export async function editPurchase(
  id: string,
  patch: Partial<Pick<Purchase, "name" | "qty" | "unitCost" | "delivery">>,
): Promise<boolean> {
  const file = await loadPurchases();
  const p = file.purchases.find((x) => x.id === id);
  if (!p) return false;
  if (patch.name !== undefined) p.name = patch.name;
  if (patch.qty !== undefined) p.qty = patch.qty;
  if (patch.unitCost !== undefined) p.unitCost = patch.unitCost;
  if (patch.delivery !== undefined) p.delivery = patch.delivery;
  await writeJSON(KEY, file);
  return true;
}

export async function deletePurchase(id: string): Promise<boolean> {
  const file = await loadPurchases();
  const i = file.purchases.findIndex((x) => x.id === id);
  if (i < 0) return false;
  file.purchases.splice(i, 1);
  await writeJSON(KEY, file);
  return true;
}

// Возвращает удалённую продажу (для отката связанной записи кассы) или null.
export async function deleteSale(purchaseId: string, saleId: string): Promise<Sale | null> {
  const file = await loadPurchases();
  const p = file.purchases.find((x) => x.id === purchaseId);
  if (!p) return null;
  const i = p.sales.findIndex((s) => s.id === saleId);
  if (i < 0) return null;
  const [removed] = p.sales.splice(i, 1);
  await writeJSON(KEY, file);
  return removed;
}
