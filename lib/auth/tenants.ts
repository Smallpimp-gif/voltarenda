// Арендаторы — через lib/store (ключ "bot/tenants"). Источник истины бота
// напоминаний. Кабинет арендатора читает; кабинет владельца — CRUD.
//
// ВНИМАНИЕ: на Vercel данные в KV, а bot/import-tenants.py и сам бот
// (отдельный процесс) работают с файлом data/bot/tenants.json. На Vercel
// они рассинхронизированы — бота нужно перевести на тот же KV (next).
// Локально (файловый режим) — единый файл, всё совместимо.

import { readJSON, writeJSON } from "@/lib/store";
import type { Tenant, TenantPosition, PaymentPeriod } from "@/lib/schedule";

const KEY = "bot/tenants";

export async function loadTenants(): Promise<Tenant[]> {
  return readJSON<Tenant[]>(KEY, []);
}

async function saveTenants(tenants: Tenant[]): Promise<void> {
  await writeJSON(KEY, tenants);
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  return (await loadTenants()).find((t) => t.id === id) ?? null;
}

// --- Нормализация для матчинга при регистрации ------------------------

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, "е");
}
function normContract(s: string): string {
  return s.trim().toLowerCase().replace(/[№#\s]/g, "");
}

export async function findTenantByContractAndSurname(
  contract: string,
  surname: string,
): Promise<Tenant | null> {
  const c = normContract(contract);
  const n = normName(surname);
  return (
    (await loadTenants()).find(
      (t) => normContract(t.contract) === c && normName(t.name) === n,
    ) ?? null
  );
}

const normUsername = (s: string) => s.trim().replace(/^@/, "").toLowerCase();

// Поиск арендатора по вписанному в карточке Telegram-нику. Для авто-привязки
// при входе в Mini App.
export async function findTenantByTelegramUsername(
  username: string,
): Promise<Tenant | null> {
  const u = normUsername(username);
  if (!u) return null;
  return (
    (await loadTenants()).find(
      (t) => normUsername(t.telegramUsername ?? "") === u,
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
  weekly: number; // сумма за один период оплаты
  period?: PaymentPeriod; // day | week | month; по умолчанию week
  startDate: string; // YYYY-MM-DD
  buyoutWeeks: number | null; // число периодов до выкупа
  telegramUsername?: string;
  positions?: TenantPosition[];
  deposit?: number;
};

export async function addTenant(input: TenantInput): Promise<Tenant> {
  const tenants = await loadTenants();
  const id = uniqueId(input.name, new Set(tenants.map((t) => t.id)));
  const tenant: Tenant = {
    id,
    name: input.name.trim(),
    contract: input.contract.trim(),
    type: input.type,
    weekly: input.weekly,
    period: input.period ?? "week",
    startDate: input.startDate,
    buyoutWeeks: input.type === "выкуп" ? input.buyoutWeeks : null,
    telegramUsername: input.telegramUsername?.trim() ?? "",
    positions: input.positions ?? [],
    deposit: input.deposit,
  };
  tenants.push(tenant);
  await saveTenants(tenants);
  return tenant;
}

export async function updateTenant(id: string, input: TenantInput): Promise<Tenant | null> {
  const tenants = await loadTenants();
  const idx = tenants.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated: Tenant = {
    ...tenants[idx],
    name: input.name.trim(),
    contract: input.contract.trim(),
    type: input.type,
    weekly: input.weekly,
    period: input.period ?? tenants[idx].period ?? "week",
    startDate: input.startDate,
    buyoutWeeks: input.type === "выкуп" ? input.buyoutWeeks : null,
    telegramUsername:
      input.telegramUsername?.trim() ?? tenants[idx].telegramUsername ?? "",
    positions: input.positions ?? tenants[idx].positions ?? [],
    deposit: input.deposit ?? tenants[idx].deposit,
  };
  tenants[idx] = updated;
  await saveTenants(tenants);
  return updated;
}

// Частичное обновление записи (пауза и т.п.) без валидации формы.
export async function patchTenant(
  id: string,
  patch: Partial<Tenant>,
): Promise<Tenant | null> {
  const tenants = await loadTenants();
  const idx = tenants.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tenants[idx] = { ...tenants[idx], ...patch };
  await saveTenants(tenants);
  return tenants[idx];
}

export async function deleteTenant(id: string): Promise<boolean> {
  const tenants = await loadTenants();
  const next = tenants.filter((t) => t.id !== id);
  if (next.length === tenants.length) return false;
  await saveTenants(next);
  return true;
}
