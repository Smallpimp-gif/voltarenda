"use client";

// Список арендаторов — рабочий инструмент владельца: статус оплат
// (просрочено / сегодня / оплачено), отметка оплаты, напоминание в TG,
// правка/удаление. Поиск + фильтры + сортировка по срочности.
// Одна разметка: на десктопе — таблица, на мобильном — карточки.

import { useMemo, useState } from "react";
import Link from "next/link";
import { markPaidAction, togglePauseAction } from "@/lib/auth/owner-actions";
import { DeleteTenantButton } from "./delete-button";

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type PayKind = "overdue" | "partial" | "today" | "upcoming" | "done";

export type TenantRow = {
  id: string;
  name: string;
  contract: string;
  type: string;
  weekly: number;
  telegramUsername: string;
  paidThrough: number;
  totalWeeks: number | null;
  overdueCount: number;
  nextNumber: number | null;
  nextDate: string | null;
  nextWeekday: string | null;
  nextDaysUntil: number | null;
  kind: PayKind;
  paused: boolean;
  pauseFee: number;
  partialDebt: number; // мягкая недоплата за текущую неделю
};

type Filter = "all" | "overdue" | "today" | "buyout" | "rent";
type SortKey = "urgency" | "name" | "amount";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "overdue", label: "Долг" },
  { key: "today", label: "Сегодня" },
  { key: "buyout", label: "Выкуп" },
  { key: "rent", label: "Аренда" },
];

function statusText(r: TenantRow): { label: string; cls: string } {
  if (r.paused)
    return { label: "На паузе", cls: "border border-dashed border-[var(--line-strong)] text-mute" };
  switch (r.kind) {
    case "done":
      return { label: "Оплачено", cls: "border border-[var(--line-strong)] text-mute" };
    case "overdue":
      return { label: `Просрочено · ${r.overdueCount}`, cls: "bg-danger/15 text-danger" };
    case "partial":
      return { label: `Недоплата ${money(r.partialDebt)}`, cls: "bg-[#FEF3C7] text-[#92400E]" };
    case "today":
      return { label: "Сегодня", cls: "bg-volt text-ink" };
    default: {
      const d = r.nextDaysUntil ?? 0;
      return {
        label: d === 1 ? "Завтра" : `${d} дн.`,
        cls: "border border-[var(--line-strong)] text-[var(--text)]",
      };
    }
  }
}

// Кнопка «Оплатил» / «Отменить» — server action, без перезагрузки.
function PaidControls({ row }: { row: TenantRow }) {
  // На паузе недельные платежи не идут — показываем плату за паузу.
  if (row.paused) {
    return (
      <span className="text-caption text-mute">
        Пауза · {money(row.pauseFee)}/мес
      </span>
    );
  }
  if (row.kind === "done") {
    return (
      <form action={markPaidAction}>
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="dir" value="dec" />
        <button type="submit" className="text-caption text-mute transition-colors duration-quick hover:text-[var(--text)]">
          Отменить
        </button>
      </form>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <form action={markPaidAction}>
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="dir" value="inc" />
        <button
          type="submit"
          className="rounded-pill bg-volt px-4 py-1.5 text-caption font-medium text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
        >
          Оплатил
        </button>
      </form>
      <PartialControl row={row} />
      {row.overdueCount > 1 && (
        <form action={markPaidAction} title="Отметить все просроченные оплаченными">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="dir" value="catchup" />
          <button type="submit" className="text-caption text-mute transition-colors duration-quick hover:text-[var(--text)]">
            до сегодня
          </button>
        </form>
      )}
      {row.paidThrough > 0 && (
        <form action={markPaidAction} title="Отменить последнюю оплату">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="dir" value="dec" />
          <button type="submit" className="text-caption text-mute transition-colors duration-quick hover:text-[var(--text)]">
            ↩
          </button>
        </form>
      )}
    </div>
  );
}

// Частичная оплата: вводим произвольную сумму, копится в текущую неделю.
function PartialControl({ row }: { row: TenantRow }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-caption text-mute transition-colors duration-quick hover:text-[var(--text)]"
      >
        Частично
      </button>
    );
  }
  return (
    <form action={markPaidAction} onSubmit={() => setOpen(false)} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="dir" value="partial" />
      <input
        name="amount"
        type="number"
        min={1}
        step="0.01"
        inputMode="decimal"
        autoFocus
        placeholder="сумма ₽"
        className="w-24 rounded-lg border border-[var(--line-strong)] bg-[var(--bg)] px-2 py-1 text-caption text-[var(--text)] outline-none focus:border-volt"
      />
      <button type="submit" className="rounded-pill bg-volt px-2.5 py-1 text-caption font-medium text-ink">
        Внести
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-caption text-mute">
        ✕
      </button>
    </form>
  );
}

// Пауза/снятие паузы — только для выкупа (есть totalWeeks).
function PauseControl({ row }: { row: TenantRow }) {
  if (row.totalWeeks == null) return null;
  return (
    <form action={togglePauseAction}>
      <input type="hidden" name="id" value={row.id} />
      <button
        type="submit"
        className={`transition-colors duration-quick hover:text-[var(--text)] ${
          row.paused ? "text-[var(--text)]" : ""
        }`}
        title={row.paused ? "Возобновить выкуп" : "Поставить выкуп на паузу"}
      >
        {row.paused ? "Снять паузу" : "Пауза"}
      </button>
    </form>
  );
}

function RowActions({ row }: { row: TenantRow }) {
  return (
    <div className="flex items-center gap-4 text-caption text-mute">
      <PauseControl row={row} />
      {row.telegramUsername && (
        <a
          href={`https://t.me/${row.telegramUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-quick hover:text-[var(--text)]"
        >
          Напомнить
        </a>
      )}
      <Link
        href={`/cabinet/owner?edit=${row.id}`}
        className="transition-colors duration-quick hover:text-[var(--text)]"
      >
        Изменить
      </Link>
      <DeleteTenantButton id={row.id} name={row.name} />
    </div>
  );
}

function urgency(r: TenantRow): number {
  if (r.paused) return 5e8; // на паузе — внизу, но выше завершённых
  if (r.kind === "overdue") return -1000 - r.overdueCount;
  if (r.kind === "partial") return -500; // недоплата — после просрочки
  if (r.kind === "done") return 1e9;
  return r.nextDaysUntil ?? 0;
}

export function TenantsTable({ rows }: { rows: TenantRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("urgency");
  const [dir, setDir] = useState<1 | -1>(1);

  const toggleSort = (k: SortKey) => {
    if (k === sort) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(1);
    }
  };

  const view = useMemo(() => {
    const q = query.trim().toLowerCase();
    const r = rows.filter((row) => {
      if (q && !`${row.name} ${row.contract}`.toLowerCase().includes(q)) return false;
      switch (filter) {
        case "overdue":
          return row.kind === "overdue" || row.kind === "partial";
        case "today":
          return row.kind === "today";
        case "buyout":
          return row.totalWeeks != null;
        case "rent":
          return row.totalWeeks == null;
        default:
          return true;
      }
    });
    return [...r].sort((a, b) => {
      let cmp = 0;
      if (sort === "name") cmp = a.name.localeCompare(b.name, "ru");
      else if (sort === "amount") cmp = a.weekly - b.weekly;
      else cmp = urgency(a) - urgency(b);
      return cmp * dir;
    });
  }, [rows, query, filter, sort, dir]);

  const overdueTotal = rows.filter((r) => r.kind === "overdue").length;

  return (
    <div>
      {/* Тулбар */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по фамилии или договору…"
          className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--bg-2)] px-5 py-3 text-body text-[var(--text)] outline-none transition-colors duration-quick placeholder:text-mute focus:border-volt sm:flex-1"
        />
        <div className="-mx-gutter flex gap-1.5 overflow-x-auto px-gutter sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-2 font-mono text-caption uppercase transition-colors duration-quick ${
                filter === f.key
                  ? "bg-[var(--text)] text-[var(--bg)]"
                  : "border border-[var(--line-strong)] text-mute hover:text-[var(--text)]"
              }`}
            >
              {f.label}
              {f.key === "overdue" && overdueTotal > 0 && (
                <span className={`rounded-pill px-1.5 ${filter === f.key ? "bg-[var(--bg)] text-danger" : "bg-danger text-paper"}`}>
                  {overdueTotal}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Заголовок таблицы (десктоп) */}
      <div className="mt-5 hidden grid-cols-[1.8fr_1fr_auto_auto] items-center gap-4 border-b border-[var(--line)] px-4 pb-2 md:grid">
        <SortHeader label="Арендатор" k="name" sort={sort} dir={dir} onSort={toggleSort} />
        <SortHeader label="Платёж" k="amount" sort={sort} dir={dir} onSort={toggleSort} />
        <SortHeader label="Статус" k="urgency" sort={sort} dir={dir} onSort={toggleSort} />
        <span className="justify-self-end font-mono text-caption uppercase text-mute">Действия</span>
      </div>

      {/* Строки */}
      <div className="flex flex-col">
        {view.length === 0 && (
          <p className="mt-4 rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-6 text-body text-mute">
            Ничего не найдено.
          </p>
        )}
        {view.map((row) => {
          const st = statusText(row);
          const paidInfo = row.paused
            ? `на паузе · ${money(row.pauseFee)}/мес`
            : row.totalWeeks
              ? `оплачено ${row.paidThrough}/${row.totalWeeks}`
              : `оплачено ${row.paidThrough}`;
          return (
            <div key={row.id} className="border-b border-[var(--line)]">
              {/* Мобильная карточка */}
              <div className="flex flex-col gap-3 py-4 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/cabinet/owner?edit=${row.id}`}
                    className="min-w-0 transition-opacity duration-quick active:opacity-60"
                  >
                    <p className="flex items-center gap-1 truncate text-body-lg font-medium text-[var(--text)]">
                      {row.name}
                      <span aria-hidden className="text-mute">›</span>
                    </p>
                    <p className="mt-1 truncate text-caption text-mute">
                      {capFirst(paidInfo)} · {money(row.weekly)}/нед · договор {row.contract}
                    </p>
                  </Link>
                  <span className={`shrink-0 rounded-pill px-2.5 py-1 font-mono text-caption uppercase ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <PaidControls row={row} />
                  <RowActions row={row} />
                </div>
              </div>

              {/* Десктопная строка */}
              <div className="hidden grid-cols-[1.8fr_1fr_auto_auto] items-center gap-4 px-4 py-4 transition-colors duration-quick hover:bg-[var(--bg-2)] md:grid">
                <Link href={`/cabinet/owner?edit=${row.id}`} className="min-w-0 group">
                  <p className="flex items-center gap-1 truncate text-body-lg font-medium text-[var(--text)] transition-colors duration-quick group-hover:text-volt">
                    {row.name}
                    <span aria-hidden className="text-mute opacity-0 transition-opacity duration-quick group-hover:opacity-100">›</span>
                  </p>
                  <p className="mt-0.5 text-caption text-mute">
                    {capFirst(paidInfo)} · {money(row.weekly)}/нед · {row.type === "выкуп" ? "выкуп" : "аренда"} · договор {row.contract}
                  </p>
                </Link>
                <div className="min-w-0">
                  <span className="text-body text-[var(--text)]">{money(row.weekly)}</span>
                  {row.nextDate && !row.paused && (
                    <span className="ml-2 font-mono text-caption text-mute">след. {row.nextDate}</span>
                  )}
                </div>
                <div className="justify-self-start">
                  <span className={`inline-block rounded-pill px-2.5 py-1 font-mono text-caption uppercase ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 justify-self-end">
                  <PaidControls row={row} />
                  <RowActions row={row} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 font-mono text-caption uppercase text-mute">
        Показано {view.length} из {rows.length}
      </p>
    </div>
  );
}

function SortHeader({
  label,
  k,
  sort,
  dir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: SortKey;
  dir: 1 | -1;
  onSort: (k: SortKey) => void;
}) {
  const active = sort === k;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={`flex items-center gap-1 font-mono text-caption uppercase transition-colors duration-quick hover:text-[var(--text)] ${
        active ? "text-[var(--text)]" : "text-mute"
      }`}
    >
      {label}
      <span aria-hidden className="text-[10px]">{active ? (dir === 1 ? "↑" : "↓") : ""}</span>
    </button>
  );
}
