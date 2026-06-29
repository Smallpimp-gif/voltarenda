// Залоги арендаторов: у каждого сумма залога (по умолчанию 5000 ₽), внизу —
// итог удерживаемых залогов. Без интерактива — общий компонент.

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const money = (n: number) => `${rub.format(n)} ₽`;

export type DepositRow = { id: string; name: string; deposit: number };

export function DepositsPanel({ rows }: { rows: DepositRow[] }) {
  const total = rows.reduce((s, r) => s + r.deposit, 0);
  const withDeposit = rows.filter((r) => r.deposit > 0).length;

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-5">
        <p className="text-caption font-medium text-mute">Залоги удержано</p>
        <p className="mt-1.5 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
          {money(total)}
        </p>
        <p className="mt-2 font-mono text-caption uppercase text-mute">
          {withDeposit} из {rows.length} с залогом
        </p>
      </div>

      <div className="border-t border-[var(--line)]">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3.5 first:border-t-0"
          >
            <span className="truncate text-body text-[var(--text)]">{r.name}</span>
            <span
              className={`shrink-0 font-sans text-body tabular-nums ${
                r.deposit > 0 ? "font-medium text-[var(--text)]" : "text-mute"
              }`}
            >
              {r.deposit > 0 ? money(r.deposit) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
