"use client";

// Касса владельца: «деньги на руках сейчас» = приход (аренда + магазин)
// − расходы. Быстрое добавление расхода (с категорией) и заработка магазина
// прямо в панели. Обнуление чистит только кассу — доходы и прогресс выкупа
// не трогает.

import { useState } from "react";
import {
  resetLedgerAction,
  setLedgerTotalAction,
  addExpenseAction,
  addShopIncomeAction,
  editLedgerEntryAction,
  deleteLedgerEntryAction,
} from "@/lib/auth/owner-actions";
import { EXPENSE_CATEGORIES, EDITABLE_KINDS, type CassaBreakdown } from "@/lib/ledger-types";

const EDITABLE = new Set<string>(EDITABLE_KINDS);

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const money = (n: number) => `${rub.format(Math.abs(n))} ₽`;

const dtFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export type LedgerRow = {
  id: string;
  name: string;
  amount: number;
  weeks: number;
  kind: string;
  category?: string;
  note?: string;
  at: string;
};

const GREEN = "#16a34a";
const RED = "#ef4444";

type AddForm = null | "expense" | "shop";

export function LedgerPanel({
  total,
  breakdown,
  rows,
  lastResetAt,
}: {
  total: number;
  breakdown: CassaBreakdown;
  rows: LedgerRow[];
  lastResetAt: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState<AddForm>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-medium text-mute">На руках сейчас</p>
          {!editing && !adding && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-caption font-medium text-mute underline-offset-2 transition-colors duration-quick hover:text-[var(--text)] hover:underline"
            >
              Изменить сумму
            </button>
          )}
        </div>

        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setEditing(false);
              void setLedgerTotalAction(fd);
            }}
            className="mt-2 flex flex-wrap items-center gap-2"
          >
            <div className="flex items-center gap-1.5 rounded-md border border-volt bg-[var(--bg)] px-3 py-2">
              <input
                name="total"
                type="number"
                step="0.01"
                inputMode="decimal"
                defaultValue={total}
                autoFocus
                className="w-36 bg-transparent font-sans text-h2 tabular-nums text-[var(--text)] outline-none"
              />
              <span className="text-mute">₽</span>
            </div>
            <button
              type="submit"
              className="rounded-pill bg-volt px-5 py-2.5 text-caption font-medium text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
            >
              Отмена
            </button>
          </form>
        ) : (
          <p className="mt-1.5 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
            {money(total)}
          </p>
        )}

        {/* Разбивка: из чего сложилась касса */}
        {!editing && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill label="Аренда" value={breakdown.rental} positive />
            <Pill label="Магазин" value={breakdown.shop} positive />
            <Pill label="Расходы" value={breakdown.expense} />
          </div>
        )}

        {/* Быстрое добавление */}
        {!editing && !adding && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdding("expense")}
              className="rounded-md border border-[var(--line-strong)] px-4 py-3 text-caption font-medium text-[var(--text)] transition-colors duration-quick hover:border-[#ef4444] hover:text-[#ef4444]"
            >
              − Расход
            </button>
            <button
              type="button"
              onClick={() => setAdding("shop")}
              className="rounded-md border border-[var(--line-strong)] px-4 py-3 text-caption font-medium text-[var(--text)] transition-colors duration-quick hover:border-volt"
            >
              + Магазин
            </button>
          </div>
        )}

        {adding === "expense" && (
          <ExpenseForm onDone={() => setAdding(null)} />
        )}
        {adding === "shop" && <ShopForm onDone={() => setAdding(null)} />}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-caption text-mute">
            {rows.length === 0
              ? "Операций пока нет"
              : `${rows.length} ${plural(rows.length, "операция", "операции", "операций")}`}
            {lastResetAt ? ` · обнулено ${dtFmt.format(new Date(lastResetAt))}` : ""}
          </p>
          {rows.length > 0 && <ResetButton />}
        </div>
      </div>

      {/* Журнал */}
      {rows.length > 0 && (
        <div className="max-h-[420px] overflow-y-auto border-t border-[var(--line)]">
          {rows.map((r) => {
            const negative = r.amount < 0;
            const sub = subtitle(r);
            const canEdit = EDITABLE.has(r.kind);

            if (canEdit && editingId === r.id) {
              return (
                <RowEditForm key={r.id} row={r} onDone={() => setEditingId(null)} />
              );
            }

            const RowTag = canEdit ? "button" : "div";
            return (
              <RowTag
                key={r.id}
                {...(canEdit
                  ? {
                      type: "button" as const,
                      onClick: () => setEditingId(r.id),
                      title: "Изменить запись",
                    }
                  : {})}
                className={`flex w-full items-center gap-3 border-b border-[var(--line)] px-5 py-3.5 text-left last:border-0 ${
                  canEdit ? "transition-colors duration-quick hover:bg-[var(--bg)]" : ""
                }`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-strong)]"
                  style={{ color: negative ? RED : GREEN }}
                >
                  <TxnIcon kind={r.kind} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-body ${r.kind === "manual" ? "text-mute" : "text-[var(--text)]"}`}>
                    {r.name}
                  </p>
                  <p className="mt-0.5 truncate text-caption text-mute">
                    {dtFmt.format(new Date(r.at))}
                    {sub ? ` · ${sub}` : ""}
                  </p>
                </div>
                <span
                  className="shrink-0 font-sans text-body font-semibold tabular-nums"
                  style={{ color: negative ? RED : GREEN }}
                >
                  {negative ? "−" : "+"}
                  {money(r.amount)}
                </span>
                {canEdit && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 shrink-0 text-[var(--line-strong)]"
                    aria-hidden
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                )}
              </RowTag>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Подпись строки журнала: тип операции + деталь.
function subtitle(r: LedgerRow): string {
  if (r.kind === "expense") return `Расход · ${r.category ?? "Прочее"}`;
  if (r.kind === "shop") return "Магазин";
  if (r.kind === "manual") return "Корректировка";
  if (r.kind === "catchup") return `Аренда · ${r.weeks} нед.`;
  return "Аренда";
}

function Pill({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const zero = value === 0;
  const color = zero ? "var(--text-mute, #9B9890)" : value < 0 ? RED : GREEN;
  const sign = value < 0 ? "−" : positive ? "+" : "";
  return (
    <div className="flex items-baseline gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5">
      <span className="text-caption text-mute">{label}</span>
      <span className="font-sans text-caption font-semibold tabular-nums" style={{ color }}>
        {zero ? "—" : `${sign}${money(value)}`}
      </span>
    </div>
  );
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onDone();
        void addExpenseAction(fd);
      }}
      className="mt-4 rounded-md border border-[var(--line-strong)] p-4"
    >
      <div className="flex items-center gap-1.5 rounded-md border border-[#ef4444] bg-[var(--bg)] px-3 py-2">
        <span className="text-mute">−</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          autoFocus
          placeholder="0"
          className="w-full bg-transparent font-sans text-h3 tabular-nums text-[var(--text)] outline-none"
        />
        <span className="text-mute">₽</span>
      </div>

      <input type="hidden" name="category" value={category} />
      <div className="mt-3 flex flex-wrap gap-2">
        {EXPENSE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-pill border px-3 py-1.5 text-caption transition-colors duration-quick ${
              category === c
                ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                : "border-[var(--line-strong)] text-mute hover:text-[var(--text)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <input
        name="note"
        type="text"
        maxLength={120}
        placeholder="Комментарий (необязательно)"
        className="mt-3 w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 text-body text-[var(--text)] outline-none placeholder:text-[var(--line-strong)] focus:border-volt"
      />

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-pill bg-[#ef4444] px-5 py-2.5 text-caption font-medium text-white transition-transform duration-quick hover:opacity-90 active:scale-95"
        >
          Записать расход
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function ShopForm({ onDone }: { onDone: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onDone();
        void addShopIncomeAction(fd);
      }}
      className="mt-4 rounded-md border border-[var(--line-strong)] p-4"
    >
      <div className="flex items-center gap-1.5 rounded-md border border-volt bg-[var(--bg)] px-3 py-2">
        <span className="text-mute">+</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          autoFocus
          placeholder="0"
          className="w-full bg-transparent font-sans text-h3 tabular-nums text-[var(--text)] outline-none"
        />
        <span className="text-mute">₽</span>
      </div>

      <input
        name="note"
        type="text"
        maxLength={120}
        placeholder="Что продали (необязательно)"
        className="mt-3 w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 text-body text-[var(--text)] outline-none placeholder:text-[var(--line-strong)] focus:border-volt"
      />

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-pill bg-volt px-5 py-2.5 text-caption font-medium text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
        >
          Записать доход
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

// Инлайн-правка записи журнала (магазин / расход / корректировка).
function RowEditForm({ row, onDone }: { row: LedgerRow; onDone: () => void }) {
  const isExpense = row.kind === "expense";
  const isManual = row.kind === "manual";
  const [category, setCategory] = useState<string>(
    row.category && (EXPENSE_CATEGORIES as readonly string[]).includes(row.category)
      ? row.category
      : EXPENSE_CATEGORIES[0],
  );
  // Сумму показываем как вводил владелец: расход/магазин — положительной,
  // корректировку — со знаком.
  const shownAmount = isManual ? row.amount : Math.abs(row.amount);
  const accent = isExpense ? "#ef4444" : "var(--volt, #d4f000)";

  function handleDelete() {
    if (!confirm("Удалить эту запись? Касса пересчитается.")) return;
    const fd = new FormData();
    fd.set("id", row.id);
    onDone();
    void deleteLedgerEntryAction(fd);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onDone();
        void editLedgerEntryAction(fd);
      }}
      className="border-b border-[var(--line)] bg-[var(--bg)] px-5 py-4 last:border-0"
    >
      <input type="hidden" name="id" value={row.id} />

      <div
        className="flex items-center gap-1.5 rounded-md border bg-[var(--bg-2)] px-3 py-2"
        style={{ borderColor: accent }}
      >
        <span className="text-mute">{isExpense ? "−" : isManual ? "±" : "+"}</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          {...(isManual ? {} : { min: "0" })}
          inputMode="decimal"
          autoFocus
          defaultValue={shownAmount}
          className="w-full bg-transparent font-sans text-h3 tabular-nums text-[var(--text)] outline-none"
        />
        <span className="text-mute">₽</span>
      </div>

      {isExpense && (
        <>
          <input type="hidden" name="category" value={category} />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-pill border px-3 py-1.5 text-caption transition-colors duration-quick ${
                  category === c
                    ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                    : "border-[var(--line-strong)] text-mute hover:text-[var(--text)]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {!isManual && (
        <input
          name="note"
          type="text"
          maxLength={120}
          defaultValue={row.note ?? ""}
          placeholder={isExpense ? "Комментарий (необязательно)" : "Что продали (необязательно)"}
          className="mt-3 w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-2)] px-3 py-2.5 text-body text-[var(--text)] outline-none placeholder:text-[var(--line-strong)] focus:border-volt"
        />
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          className="rounded-pill bg-volt px-5 py-2.5 text-caption font-medium text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="ml-auto text-caption font-medium text-mute transition-colors duration-quick hover:text-danger"
        >
          Удалить
        </button>
      </div>
    </form>
  );
}

function ResetButton() {
  return (
    <form
      action={resetLedgerAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Обнулить кассу? Сумма и журнал очистятся. Доходы и прогресс выкупа не изменятся.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-caption font-medium text-mute transition-colors duration-quick hover:text-danger"
      >
        Обнулить
      </button>
    </form>
  );
}

function TxnIcon({ kind }: { kind: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
  };
  if (kind === "shop") {
    // магазин — корзина
    return (
      <svg {...p}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }
  if (kind === "expense") {
    // расход — стрелка вверх-вправо (деньги ушли)
    return (
      <svg {...p}>
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
    );
  }
  if (kind === "manual") {
    // корректировка — карандаш
    return (
      <svg {...p}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }
  // аренда — стрелка вниз-влево (деньги пришли)
  return (
    <svg {...p}>
      <path d="M17 7 7 17" />
      <path d="M16 17H7V8" />
    </svg>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
