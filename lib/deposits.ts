// Журнал обнулений залогов — через lib/store (ключ "bot/deposit-log").
// Текущий залог живёт на арендаторе (tenant.deposit, см. depositOf);
// обнуление ставит deposit=0 и ЗАПИСЫВАЕТ событие сюда: кто, сколько,
// когда. Журнал не чистится — история возвратов/списаний всегда видна.

import { readJSON, writeJSON } from "@/lib/store";

export type DepositLogEntry = {
  id: string;
  tenantId: string;
  name: string; // фамилия либо «Корректировка/Обнуление залогов»
  // Для kind="zero" — размер обнулённого залога (показывается со знаком −).
  // Для kind="manual" — подписанная дельта ручной корректировки (до копеек).
  amount: number;
  kind?: "zero" | "manual"; // старые записи без kind = zero
  at: string; // ISO
};

type DepositLogFile = { entries: DepositLogEntry[] };

const KEY = "bot/deposit-log";
const EMPTY: DepositLogFile = { entries: [] };

export async function loadDepositLog(): Promise<DepositLogFile> {
  return { ...EMPTY, ...(await readJSON<Partial<DepositLogFile>>(KEY, {})) };
}

export async function addDepositLogEntry(
  e: Omit<DepositLogEntry, "id" | "at">,
): Promise<void> {
  const file = await loadDepositLog();
  file.entries.push({ ...e, id: crypto.randomUUID(), at: new Date().toISOString() });
  await writeJSON(KEY, file);
}

// Сколько всего залогов обнулено за историю (по арендаторам).
export function depositLogTotal(file: DepositLogFile): number {
  return file.entries
    .filter((e) => (e.kind ?? "zero") === "zero")
    .reduce((s, e) => s + e.amount, 0);
}

// Сумма ручных корректировок (подписанная) — прибавляется к сумме
// залогов по арендаторам, давая управляемый итог «на руках», как касса.
export function depositAdjustmentsTotal(file: DepositLogFile): number {
  return file.entries
    .filter((e) => e.kind === "manual")
    .reduce((s, e) => s + e.amount, 0);
}
