"use client";

// Касса владельца: накопительная сумма собранных оплат + журнал (таблица)
// проведённых платежей. Сумму можно задать вручную (запись-корректировка)
// или обнулить. Обнуление чистит только кассу — прогресс выкупа арендаторов
// не меняется.

import { useState } from "react";
import { resetLedgerAction, setLedgerTotalAction } from "@/lib/auth/owner-actions";

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(Math.abs(n))} ₽`;

const dtFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
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
      {/* Итог + действия */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-caption uppercase text-mute">Собрано в кассе</span>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-mono text-caption uppercase text-mute transition-colors duration-quick hover:text-[var(--text)]"
            >
              Изменить сумму
            </button>
          )}
        </div>

        {editing ? (
          <form
            action={setLedgerTotalAction}
            onSubmit={() => setEditing(false)}
            className="mt-3 flex flex-wrap items-center gap-2"
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
              className="rounded-pill bg-volt px-5 py-2.5 font-mono text-caption uppercase text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-mono text-caption uppercase text-mute transition-colors duration-quick hover:text-[var(--text)]"
            >
              Отмена
            </button>
          </form>
        ) : (
          <p className="mt-2 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
            {money(total)}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-mono text-caption uppercase text-mute">
            {rows.length} {plural(rows.length, "запись", "записи", "записей")}
            {lastResetAt ? ` · обнулено ${dtFmt.format(new Date(lastResetAt))}` : ""}
          </p>
          {rows.length > 0 && <ResetButton />}
        </div>
      </div>

      {/* Журнал */}
      {rows.length === 0 ? (
        <p className="border-t border-[var(--line)] px-6 py-8 text-center text-body text-mute">
          Оплат пока нет.<br />Отмечайте «Оплатил» у арендаторов — сумма будет копиться здесь.
        </p>
      ) : (
        <div className="border-t border-[var(--line)]">
          <div className="flex items-center justify-between gap-3 bg-[var(--bg)] px-6 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
            <span>Арендатор · когда</span>
            <span>Сумма</span>
          </div>
          <div className="max-h-[440px] overflow-y-auto">
            {rows.map((r) => {
              const correction = r.kind === "manual";
              const negative = r.amount < 0;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-6 py-3.5 transition-colors duration-quick hover:bg-[var(--bg)]"
                >
                  <div className="min-w-0">
                    <p className={`truncate text-body font-medium ${correction ? "text-mute" : "text-[var(--text)]"}`}>
                      {r.name}
                    </p>
                    <p className="mt-0.5 font-mono text-caption uppercase text-mute">
                      {dtFmt.format(new Date(r.at))}
                      {r.kind === "catchup" ? ` · ${r.weeks} нед.` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-body tabular-nums ${
                      negative ? "text-mute" : correction ? "text-[var(--text)]" : "text-[var(--text)]"
                    }`}
                  >
                    {negative ? "−" : "+"}
                    {money(r.amount)}
                  </span>
                </div>
              );
            })}
          </div>
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
            "Обнулить кассу? Сумма и журнал оплат очистятся. Прогресс выкупа арендаторов не изменится.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="font-mono text-caption uppercase text-mute transition-colors duration-quick hover:text-danger"
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
