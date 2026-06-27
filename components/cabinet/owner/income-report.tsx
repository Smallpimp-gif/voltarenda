// Доходы — постоянная сводка: всего, за текущий месяц, по месяцам и по
// арендаторам. Обнуление кассы её не сбрасывает. Без интерактива — общий
// компонент (рендерится и на сервере, и в мобильном).

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
      <p className="bg-[var(--bg)] px-5 py-2.5 text-caption font-medium text-mute">{title}</p>
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3.5"
        >
          <div className="min-w-0">
            <p className="truncate text-body text-[var(--text)]">{it.label}</p>
            <p className="mt-0.5 text-caption text-mute">{it.sub}</p>
          </div>
          <span className="shrink-0 font-sans text-body font-medium tabular-nums text-[var(--text)]">
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
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-5">
        <p className="text-caption font-medium text-mute">Доходы за всё время</p>
        <p className="mt-1.5 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
          {money(total)}
        </p>
        <span className="mt-3 inline-block rounded-pill bg-volt/20 px-3 py-1.5 text-caption font-medium text-[var(--text)]">
          Этот месяц: {money(thisMonth)}
        </span>
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
