// Залоги арендаторов: у каждого сумма залога (по умолчанию 5000 ₽), внизу —
// итог удерживаемых. Залог можно обнулить (вернули/списали) — deposit → 0
// с записью в журнал; журнал операций показан под списком. Вернуть залог
// можно через форму редактирования арендатора (поле «Залог»).

import { zeroDepositAction } from "@/lib/auth/owner-actions";

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const money = (n: number) => `${rub.format(n)} ₽`;

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const fmtDate = (iso: string) => dateFmt.format(new Date(iso));

export type DepositRow = { id: string; name: string; deposit: number };
export type DepositLogRow = { id: string; name: string; amount: number; at: string };

export function DepositsPanel({
  rows,
  log = [],
}: {
  rows: DepositRow[];
  /** Журнал обнулений, новые сверху. */
  log?: DepositLogRow[];
}) {
  const total = rows.reduce((s, r) => s + r.deposit, 0);
  const withDeposit = rows.filter((r) => r.deposit > 0).length;
  const zeroedTotal = log.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-5">
        <p className="text-caption font-medium text-mute">Залоги удержано</p>
        <p className="mt-1.5 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
          {money(total)}
        </p>
        <p className="mt-2 font-mono text-caption uppercase text-mute">
          {withDeposit} из {rows.length} с залогом
          {zeroedTotal > 0 && <> · обнулено {money(zeroedTotal)}</>}
        </p>
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
                    title="Обнулить залог (вернули/списали) — запишется в журнал"
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

      {/* Журнал обнулений — записываем и считаем */}
      {log.length > 0 && (
        <div className="border-t border-[var(--line)]">
          <p className="bg-[var(--bg)] px-5 py-2.5 text-caption font-medium text-mute">
            Журнал обнулений
          </p>
          {log.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-2.5"
            >
              <span className="min-w-0 truncate font-mono text-caption uppercase text-mute">
                {fmtDate(e.at)} · {e.name}
              </span>
              <span className="shrink-0 font-sans text-caption font-medium tabular-nums text-[var(--text)]">
                −{money(e.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
