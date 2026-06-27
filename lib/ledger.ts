// Деньги владельца. Один журнал оплат (KV "bot/ledger"), две проекции:
//
//  • КАССА — деньги «на руках сейчас»: записи после последнего обнуления
//    (lastResetAt). Обнуление НЕ удаляет записи, лишь двигает границу.
//  • ДОХОДЫ — вся история реальных оплат (kind weekly/catchup), по месяцам и
//    по арендаторам. Обнуление кассы её не трогает.
//
// kind "manual" — ручная корректировка суммы кассы, в доходы НЕ идёт.
// Прогресс выкупа арендаторов (paidThrough в lib/payments) — отдельно.

import { readJSON, writeJSON } from "@/lib/store";

export type LedgerEntry = {
  id: string;
  tenantId: string;
  name: string; // снимок фамилии на момент оплаты
  amount: number; // ₽ (может быть отрицательным — корректировка вниз)
  weeks: number; // сколько недель закрыто этой записью
  kind: "weekly" | "catchup" | "manual";
  at: string; // ISO
};

type LedgerFile = { entries: LedgerEntry[]; lastResetAt: string | null };

const KEY = "bot/ledger";
const EMPTY: LedgerFile = { entries: [], lastResetAt: null };

export async function loadLedger(): Promise<LedgerFile> {
  return { ...EMPTY, ...(await readJSON<Partial<LedgerFile>>(KEY, {})) };
}

const isIncome = (e: LedgerEntry) => e.kind === "weekly" || e.kind === "catchup";
const afterReset = (f: LedgerFile) =>
  f.lastResetAt ? f.entries.filter((e) => e.at > f.lastResetAt!) : f.entries;

// --- Касса (после последнего обнуления) -------------------------------

export function cassaTotal(file: LedgerFile): number {
  return afterReset(file).reduce((s, e) => s + e.amount, 0);
}

export function cassaEntries(file: LedgerFile): LedgerEntry[] {
  return afterReset(file);
}

export async function addLedgerEntry(
  e: Omit<LedgerEntry, "id" | "at">,
): Promise<void> {
  const file = await loadLedger();
  file.entries.push({ ...e, id: crypto.randomUUID(), at: new Date().toISOString() });
  await writeJSON(KEY, file);
}

// Откат последней оплаты арендатора — только из текущей кассы (историю
// доходов до обнуления не трогаем).
export async function removeLastLedgerEntry(tenantId: string): Promise<void> {
  const file = await loadLedger();
  for (let i = file.entries.length - 1; i >= 0; i--) {
    const e = file.entries[i];
    const inCassa = !file.lastResetAt || e.at > file.lastResetAt;
    if (e.tenantId === tenantId && inCassa) {
      file.entries.splice(i, 1);
      await writeJSON(KEY, file);
      return;
    }
  }
}

// Обнулить кассу — двигаем границу на сейчас. Записи и доходы сохраняются.
export async function resetCassa(): Promise<void> {
  const file = await loadLedger();
  file.lastResetAt = new Date().toISOString();
  await writeJSON(KEY, file);
}

// --- Доходы (вся история, реальные оплаты) ----------------------------

export function incomeTotal(file: LedgerFile): number {
  return file.entries.filter(isIncome).reduce((s, e) => s + e.amount, 0);
}

// Доход за текущий месяц (по МСК) — самый рабочий показатель.
export function incomeThisMonth(file: LedgerFile): number {
  const nowKey = monthKeyFmt.format(new Date());
  return file.entries
    .filter((e) => isIncome(e) && monthKeyFmt.format(new Date(e.at)) === nowKey)
    .reduce((s, e) => s + e.amount, 0);
}

const monthKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
});
const monthLabelFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "long",
});

export type MonthIncome = { key: string; label: string; amount: number; weeks: number };

export function incomeByMonth(file: LedgerFile): MonthIncome[] {
  const map = new Map<string, MonthIncome>();
  for (const e of file.entries) {
    if (!isIncome(e)) continue;
    const d = new Date(e.at);
    const key = monthKeyFmt.format(d); // "2026-06"
    const label = monthLabelFmt.format(d).replace(" г.", "");
    const cur = map.get(key) ?? { key, label, amount: 0, weeks: 0 };
    cur.amount += e.amount;
    cur.weeks += e.weeks || 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1)); // новые сверху
}

export type TenantIncome = { tenantId: string; name: string; amount: number; weeks: number };

export function incomeByTenant(file: LedgerFile): TenantIncome[] {
  const map = new Map<string, TenantIncome>();
  for (const e of file.entries) {
    if (!isIncome(e)) continue;
    const cur = map.get(e.tenantId) ?? { tenantId: e.tenantId, name: e.name, amount: 0, weeks: 0 };
    cur.name = e.name;
    cur.amount += e.amount;
    cur.weeks += e.weeks || 1;
    map.set(e.tenantId, cur);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}
