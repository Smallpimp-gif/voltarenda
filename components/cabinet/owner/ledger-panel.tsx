"use client";

// Касса владельца: «деньги на руках сейчас» (с последнего обнуления) + журнал
// оплат. Сумму можно задать вручную или обнулить. Обнуление чистит только
// кассу — доходы и прогресс выкупа не трогает.

import { useState } from "react";
import { resetLedgerAction, setLedgerTotalAction } from "@/lib/auth/owner-actions";

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
  at: string;
};

export function LedgerPanel({
  total,
  rows,
  lastResetAt,
}: {
  total: number;
  rows: LedgerRow[];
  lastResetAt: string | null;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-medium text-mute">На руках сейчас</p>
          {!editing && (
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
            // Сериализуем FormData ДО закрытия формы: setEditing(false) в
            // onSubmit размонтирует <form> раньше, чем React отправит action.
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
                min={0}
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

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-caption text-mute">
            {rows.length === 0
              ? "Оплат пока нет"
              : `${rows.length} ${plural(rows.length, "запись", "записи", "записей")}`}
            {lastResetAt ? ` · обнулено ${dtFmt.format(new Date(lastResetAt))}` : ""}
          </p>
          {rows.length > 0 && <ResetButton />}
        </div>
      </div>

      {/* Журнал — только если есть записи */}
      {rows.length > 0 && (
        <div className="max-h-[420px] overflow-y-auto border-t border-[var(--line)]">
          {rows.map((r) => {
            const negative = r.amount < 0;
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-3.5 last:border-0"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-strong)] text-mute">
                  <TxnIcon negative={negative} manual={r.kind === "manual"} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-body ${r.kind === "manual" ? "text-mute" : "text-[var(--text)]"}`}>
                    {r.name}
                  </p>
                  <p className="mt-0.5 text-caption text-mute">
                    {dtFmt.format(new Date(r.at))}
                    {r.kind === "catchup" ? ` · ${r.weeks} нед.` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-sans text-body font-semibold tabular-nums ${
                    negative ? "text-mute" : "text-[#16a34a]"
                  }`}
                >
                  {negative ? "−" : "+"}
                  {money(r.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
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

function TxnIcon({ negative, manual }: { negative: boolean; manual: boolean }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
  };
  if (manual) {
    // корректировка — карандаш
    return (
      <svg {...p}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }
  // поступление — стрелка вниз-влево (деньги пришли); откат — вверх-вправо
  return negative ? (
    <svg {...p}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  ) : (
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
