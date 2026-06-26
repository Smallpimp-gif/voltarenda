// Арендаторы — data/bot/tenants.json. Это источник истины бота
// напоминаний (bot/index.mjs). Кабинет арендатора читает файл; кабинет
// владельца — читает И пишет (CRUD).
//
// ВНИМАНИЕ про сосуществование с Excel-импортом: bot/import-tenants.py
// ПОЛНОСТЬЮ перезаписывает этот файл из Excel (сохраняя только
// telegramUsername по совпадающим id). Поэтому арендаторы, добавленные
// через админку и отсутствующие в Excel, при повторном импорте пропадут.
// Решение: после старта админки считать её источником истины и не
// запускать import-tenants.py (или потом сделать импорт дополняющим).

import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import type { Tenant } from "@/lib/schedule";

const DIR = path.join(process.cwd(), "data", "bot");
const FILE = path.join(DIR, "tenants.json");

export function loadTenants(): Tenant[] {
  if (!existsSync(FILE)) return [];
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as Tenant[];
  } catch (err) {
    console.error("[auth/tenants] не смог прочитать tenants.json:", (err as Error).message);
    return [];
  }
}

function saveTenants(tenants: Tenant[]) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(tenants, null, 2), "utf-8");
  renameSync(tmp, FILE);
}

export function getTenantById(id: string): Tenant | null {
  return loadTenants().find((t) => t.id === id) ?? null;
}

// --- Нормализация для матчинга при регистрации арендатора -------------

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, "е");
}
function normContract(s: string): string {
  return s.trim().toLowerCase().replace(/[№#\s]/g, "");
}

// Поиск по номеру договора + фамилии. Договор не уникален (несколько
// арендаторов на одном договоре), поэтому матчим И по договору, И по фамилии.
export function findTenantByContractAndSurname(
  contract: string,
  surname: string,
): Tenant | null {
  const c = normContract(contract);
  const n = normName(surname);
  return (
    loadTenants().find(
      (t) => normContract(t.contract) === c && normName(t.name) === n,
    ) ?? null
  );
}

// --- Генерация id (slug из фамилии транслитом, как в import-tenants.py) -

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "tenant";
}

function uniqueId(name: string, existing: Set<string>): string {
  const base = slugify(name);
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

// --- CRUD (кабинет владельца) -----------------------------------------

export type TenantInput = {
  name: string;
  contract: string;
  type: "аренда" | "выкуп";
  weekly: number;
  startDate: string; // YYYY-MM-DD
  buyoutWeeks: number | null;
  telegramUsername?: string;
};

export function addTenant(input: TenantInput): Tenant {
  const tenants = loadTenants();
  const id = uniqueId(input.name, new Set(tenants.map((t) => t.id)));
  const tenant: Tenant = {
    id,
    name: input.name.trim(),
    contract: input.contract.trim(),
    type: input.type,
    weekly: input.weekly,
    startDate: input.startDate,
    buyoutWeeks: input.type === "выкуп" ? input.buyoutWeeks : null,
    telegramUsername: input.telegramUsername?.trim() ?? "",
  };
  tenants.push(tenant);
  saveTenants(tenants);
  return tenant;
}

export function updateTenant(id: string, input: TenantInput): Tenant | null {
  const tenants = loadTenants();
  const idx = tenants.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated: Tenant = {
    ...tenants[idx],
    name: input.name.trim(),
    contract: input.contract.trim(),
    type: input.type,
    weekly: input.weekly,
    startDate: input.startDate,
    buyoutWeeks: input.type === "выкуп" ? input.buyoutWeeks : null,
    telegramUsername:
      input.telegramUsername?.trim() ?? tenants[idx].telegramUsername ?? "",
  };
  tenants[idx] = updated;
  saveTenants(tenants);
  return updated;
}

export function deleteTenant(id: string): boolean {
  const tenants = loadTenants();
  const next = tenants.filter((t) => t.id !== id);
  if (next.length === tenants.length) return false;
  saveTenants(next);
  return true;
}
