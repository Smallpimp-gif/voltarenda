"use client";

// Касса владельца: «деньги на руках сейчас» (с последнего обнуления) + журнал
// оплат. Сумму можно задать вручную или обнулить. Обнуление чистит только
// кассу — доходы и прогресс выкупа не трогает.

import { useState } from "react";
import { resetLedgerAction, setLedgerTotalAction } from "@/lib/auth/owner-actions";

const rub = new Intl.NumberFormat("ru-RU");
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
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
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
            action={setLedgerTotalAction}
            onSubmit={() => setEditing(false)}
            className="mt-2 flex flex-wrap items-center gap-2"
          >
            <div className="flex items-center gap-1.5 rounded-md border border-volt bg-[var(--bg)] px-3 py-2">
              <input
                name="total"
                type="number"
                min={0}
                step={100}
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
                className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className={`truncate text-body ${r.kind === "manual" ? "text-mute" : "text-[var(--text)]"}`}>
                    {r.name}
                  </p>
                  <p className="mt-0.5 text-caption text-mute">
                    {dtFmt.format(new Date(r.at))}
                    {r.kind === "catchup" ? ` · ${r.weeks} нед.` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-sans text-body font-medium tabular-nums text-[var(--text)]">
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

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
