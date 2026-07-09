"use client";

// Залоги арендаторов. Итог «на руках» управляется как касса: можно задать
// сумму вручную (до копеек) или обнулить целиком — обе операции пишутся в
// журнал корректировкой. Плюс точечное обнуление залога арендатора
// (вернули/списали). Итог = сумма по арендаторам + ручные корректировки.

import { useState } from "react";
import {
  zeroDepositAction,
  setDepositsTotalAction,
  resetDepositsAction,
} from "@/lib/auth/owner-actions";

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const money = (n: number) => `${rub.format(Math.abs(n))} ₽`;

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const fmtDate = (iso: string) => dateFmt.format(new Date(iso));

export type DepositRow = { id: string; name: string; deposit: number };
export type DepositLogRow = {
  id: string;
  name: string;
  amount: number;
  kind?: "zero" | "manual";
  at: string;
};

export function DepositsPanel({
  rows,
  log = [],
  adjustment = 0,
}: {
  rows: DepositRow[];
  /** Журнал операций, новые сверху. */
  log?: DepositLogRow[];
  /** Сумма ручных корректировок (подписанная) — прибавляется к итогу. */
  adjustment?: number;
}) {
  const [editing, setEditing] = useState(false);
  const tenantSum = rows.reduce((s, r) => s + r.deposit, 0);
  const total = Math.round((tenantSum + adjustment) * 100) / 100;
  const withDeposit = rows.filter((r) => r.deposit > 0).length;

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-medium text-mute">Залоги на руках</p>
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
              void setDepositsTotalAction(fd);
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
            {withDeposit} из {rows.length} с залогом
            {adjustment !== 0 && (
              <> · корректировка {adjustment > 0 ? "+" : "−"}{money(adjustment)}</>
            )}
          </p>
          {total !== 0 && <ResetDepositsButton />}
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3 first:border-t-0"
          >
            <span className="min-w-0 truncate text-body text-[var(--text)]">{r.name}</span>
            <span className="flex shrink-0 items-center gap-3">
              <span
                className={`font-sans text-body tabular-nums ${
                  r.deposit > 0 ? "font-medium text-[var(--text)]" : "text-mute"
                }`}
              >
                {r.deposit > 0 ? money(r.deposit) : "—"}
              </span>
              {r.deposit > 0 && (
                <form action={zeroDepositAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    title="Обнулить залог арендатора (вернули/списали) — запишется в журнал"
                    className="rounded-pill border border-[var(--line-strong)] px-3 py-1 text-caption text-mute transition-colors duration-quick hover:border-[var(--text)] hover:text-[var(--text)] active:scale-95"
                  >
                    Обнулить
                  </button>
                </form>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Журнал операций — записываем и считаем */}
      {log.length > 0 && (
        <div className="border-t border-[var(--line)]">
          <p className="bg-[var(--bg)] px-5 py-2.5 text-caption font-medium text-mute">
            Журнал операций
          </p>
          {log.map((e) => {
            const manual = e.kind === "manual";
            const negative = manual ? e.amount < 0 : true;
            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-2.5"
              >
                <span className="min-w-0 truncate font-mono text-caption uppercase text-mute">
                  {fmtDate(e.at)} · {e.name}
                </span>
                <span
                  className={`shrink-0 font-sans text-caption font-medium tabular-nums ${
                    negative ? "text-[var(--text)]" : "text-[#16a34a]"
                  }`}
                >
                  {negative ? "−" : "+"}
                  {money(e.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResetDepositsButton() {
  return (
    <form
      action={resetDepositsAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Обнулить итог залогов? Запишется корректировка. Суммы залогов у арендаторов (кому сколько вернуть) не изменятся.",
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
