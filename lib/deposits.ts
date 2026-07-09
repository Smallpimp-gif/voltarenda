// Журнал обнулений залогов — через lib/store (ключ "bot/deposit-log").
// Текущий залог живёт на арендаторе (tenant.deposit, см. depositOf);
// обнуление ставит deposit=0 и ЗАПИСЫВАЕТ событие сюда: кто, сколько,
// когда. Журнал не чистится — история возвратов/списаний всегда видна.

import { readJSON, writeJSON } from "@/lib/store";

export type DepositLogEntry = {
  id: string;
  tenantId: string;
  name: string; // снимок фамилии на момент обнуления
  amount: number; // ₽ — размер обнулённого залога
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

// Сколько всего залогов обнулено за историю.
export function depositLogTotal(file: DepositLogFile): number {
  return file.entries.reduce((s, e) => s + e.amount, 0);
}
