// Доходы — постоянная сводка по всей истории оплат: всего, за текущий месяц,
// по месяцам и по арендаторам. Обнуление кассы её не сбрасывает. Без
// интерактива — общий компонент (рендерится и на сервере, и в мобильном).

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;

export type MonthRow = { key: string; label: string; amount: number; weeks: number };
export type TenantRow = { tenantId: string; name: string; amount: number; weeks: number };

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Item = { id: string; label: string; sub: string; amount: number };

function Section({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <div className="bg-[var(--bg)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
        {title}
      </div>
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3 transition-colors duration-quick hover:bg-[var(--bg)]"
        >
          <div className="min-w-0">
            <p className="truncate text-body text-[var(--text)]">{it.label}</p>
            <p className="mt-0.5 font-mono text-caption uppercase text-mute">{it.sub}</p>
          </div>
          <span className="shrink-0 font-mono text-body tabular-nums text-[var(--text)]">
            {money(it.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IncomeReport({
  total,
  thisMonth,
  months,
  tenants,
}: {
  total: number;
  thisMonth: number;
  months: MonthRow[];
  tenants: TenantRow[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-5">
        <span className="font-mono text-caption uppercase text-mute">Доходы за всё время</span>
        <p className="mt-2 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
          {money(total)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-pill bg-volt/20 px-3 py-1 font-mono text-caption uppercase text-[var(--text)]">
            Этот месяц · {money(thisMonth)}
          </span>
          <span className="font-mono text-caption uppercase text-mute">
            не сбрасывается обнулением
          </span>
        </div>
      </div>

      {months.length === 0 ? (
        <p className="border-t border-[var(--line)] px-5 py-8 text-center text-body text-mute">
          Доходов пока нет.
        </p>
      ) : (
        <div className="border-t border-[var(--line)]">
          <Section
            title="По месяцам"
            items={months.map((m) => ({
              id: m.key,
              label: cap(m.label),
              sub: `${m.weeks} ${plural(m.weeks, "оплата", "оплаты", "оплат")}`,
              amount: m.amount,
            }))}
          />
          <div className="border-t border-[var(--line)]">
            <Section
              title="По арендаторам"
              items={tenants.map((t) => ({
                id: t.tenantId || t.name,
                label: t.name,
                sub: `${t.weeks} ${plural(t.weeks, "оплата", "оплаты", "оплат")}`,
                amount: t.amount,
              }))}
            />
          </div>
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
