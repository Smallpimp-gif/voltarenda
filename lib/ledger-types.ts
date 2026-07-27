// Чистые типы и константы кассы — без импорта store/node:fs, чтобы их можно
// было использовать в клиентских компонентах (ledger.ts тянет файловый store
// и в клиентский бандл попадать не должен).

export type LedgerKind = "weekly" | "catchup" | "shop" | "expense" | "manual";

export type LedgerEntry = {
  id: string;
  tenantId: string;
  name: string;
  amount: number; // ₽ (расход хранится отрицательным числом)
  weeks: number;
  kind: LedgerKind;
  category?: string;
  note?: string;
  at: string; // ISO
};

// Редактируемые вручную типы записей (магазин / расход / корректировка).
// Аренду (weekly/catchup) правим через оплату арендатора, а не в журнале.
export const EDITABLE_KINDS: readonly LedgerKind[] = ["shop", "expense", "manual"];

// Категории расходов — фикс. список для быстрого выбора в кабинете.
export const EXPENSE_CATEGORIES = [
  "Ремонт",
  "Запчасти",
  "Закупка",
  "Реклама",
  "Зарплата",
  "Аренда/склад",
  "Прочее",
] as const;

// Разбивка кассы «на руках»: из чего складывается итог (после обнуления).
export type CassaBreakdown = {
  rental: number; // приход от аренды (weekly + catchup)
  shop: number; // приход от магазина
  expense: number; // расходы (отрицательное число)
  manual: number; // ручные корректировки
  total: number; // итог = сумма всех
};

export type CategorySpend = { category: string; amount: number };
