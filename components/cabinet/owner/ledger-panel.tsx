"use client";

// Касса владельца: накопительная сумма собранных оплат + журнал (таблица)
// проведённых платежей, с кнопкой «Обнулить». Обнуление чистит только кассу,
// прогресс выкупа арендаторов не меняется.

import { resetLedgerAction } from "@/lib/auth/owner-actions";

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;

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

function ResetButton({ disabled }: { disabled: boolean }) {
  return (
    <form
      action={resetLedgerAction}
      onSubmit={(e) => {
        if (!confirm("Обнулить кассу? Сумма и журнал оплат очистятся. Прогресс выкупа арендаторов не изменится.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={disabled}
        className="rounded-pill border border-[var(--line-strong)] px-5 py-2.5 font-mono text-caption uppercase text-mute transition-colors duration-quick hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
      >
        Обнулить
      </button>
    </form>
  );
}

export function LedgerPanel({
  total,
  rows,
  lastResetAt,
}: {
  total: number;
  rows: LedgerRow[];
  lastResetAt: string | null;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
      {/* Итог + обнуление */}
      <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] p-6">
        <div className="min-w-0">
          <span className="font-mono text-caption uppercase text-mute">Собрано в кассе</span>
          <p className="mt-2 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
            {money(total)}
          </p>
          <p className="mt-2 font-mono text-caption uppercase text-mute">
            {rows.length} {plural(rows.length, "оплата", "оплаты", "оплат")}
            {lastResetAt ? ` · обнулено ${dtFmt.format(new Date(lastResetAt))}` : ""}
          </p>
        </div>
        <ResetButton disabled={rows.length === 0} />
      </div>

      {/* Таблица */}
      {rows.length === 0 ? (
        <p className="p-6 text-body text-mute">
          Оплат пока нет. Отмечайте «Оплатил» у арендаторов — сумма будет копиться здесь.
        </p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-6 py-3.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-body font-medium text-[var(--text)]">{r.name}</p>
                <p className="mt-0.5 font-mono text-caption uppercase text-mute">
                  {dtFmt.format(new Date(r.at))}
                  {r.kind === "catchup" ? ` · ${r.weeks} нед.` : ""}
                </p>
              </div>
              <span className="shrink-0 font-mono text-body tabular-nums text-[var(--text)]">
                +{money(r.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
