// Касса — журнал проведённых оплат (через lib/store, ключ "bot/ledger").
// Каждая отметка «Оплатил»/«до сегодня» добавляет запись; общая сумма =
// сумма всех записей. Обнуление чистит журнал (прогресс выкупа арендаторов
// при этом НЕ трогается — это отдельный счётчик paidThrough в lib/payments).

import { readJSON, writeJSON } from "@/lib/store";

export type LedgerEntry = {
  id: string;
  tenantId: string;
  name: string; // снимок фамилии на момент оплаты
  amount: number; // ₽
  weeks: number; // сколько недель закрыто этой записью
  kind: "weekly" | "catchup";
  at: string; // ISO
};

type LedgerFile = { entries: LedgerEntry[]; lastResetAt: string | null };

const KEY = "bot/ledger";
const EMPTY: LedgerFile = { entries: [], lastResetAt: null };

export async function loadLedger(): Promise<LedgerFile> {
  return { ...EMPTY, ...(await readJSON<Partial<LedgerFile>>(KEY, {})) };
}

export function ledgerTotal(file: LedgerFile): number {
  return file.entries.reduce((s, e) => s + e.amount, 0);
}

export async function addLedgerEntry(
  e: Omit<LedgerEntry, "id" | "at">,
): Promise<void> {
  const file = await loadLedger();
  file.entries.push({ ...e, id: crypto.randomUUID(), at: new Date().toISOString() });
  await writeJSON(KEY, file);
}

// Откат последней оплаты арендатора (для кнопки «↩» / «Отменить»).
export async function removeLastLedgerEntry(tenantId: string): Promise<void> {
  const file = await loadLedger();
  for (let i = file.entries.length - 1; i >= 0; i--) {
    if (file.entries[i].tenantId === tenantId) {
      file.entries.splice(i, 1);
      await writeJSON(KEY, file);
      return;
    }
  }
}

export async function clearLedger(): Promise<void> {
  await writeJSON(KEY, { entries: [], lastResetAt: new Date().toISOString() });
}
