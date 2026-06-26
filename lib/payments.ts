// Учёт оплат арендаторов. По каждому храним «оплачено до платежа N»
// (paidThrough) — порядковый номер последнего подтверждённого платежа.
// Отсюда считаем просрочку и следующий НЕоплаченный платёж.
//
// Файл data/bot/payments.json (gitignored, как остальной data/).
// Атомарная запись tmp+rename. Источник истины по фактам оплаты —
// владелец (отмечает вручную в кабинете).

import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "data", "bot");
const FILE = path.join(DIR, "payments.json");

type PaymentsFile = Record<string, { paidThrough: number; updatedAt: string }>;

function load(): PaymentsFile {
  if (!existsSync(FILE)) return {};
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as PaymentsFile;
  } catch (err) {
    console.error("[payments] не смог прочитать payments.json:", (err as Error).message);
    return {};
  }
}

function save(data: PaymentsFile) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  renameSync(tmp, FILE);
}

export function getPaidThrough(tenantId: string): number {
  return load()[tenantId]?.paidThrough ?? 0;
}

// Карта tenantId → paidThrough для всех (одно чтение на страницу).
export function loadPaidMap(): Record<string, number> {
  const data = load();
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(data)) out[id] = v.paidThrough;
  return out;
}

export function setPaidThrough(tenantId: string, n: number): void {
  const data = load();
  data[tenantId] = { paidThrough: Math.max(0, Math.floor(n)), updatedAt: new Date().toISOString() };
  save(data);
}
