// Доходы — постоянная сводка по всей истории оплат: всего, по месяцам и по
// арендаторам. Обнуление кассы её не сбрасывает. Без интерактива — общий
// компонент (рендерится и на сервере, и внутри мобильного клиента).

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;

export type MonthRow = { key: string; label: string; amount: number; weeks: number };
export type TenantRow = { tenantId: string; name: string; amount: number; weeks: number };

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Section({ title, items }: { title: string; items: { id: string; label: string; amount: number }[] }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 bg-[var(--bg)] px-6 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
        <span>{title}</span>
        <span>Сумма</span>
      </div>
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-6 py-3 transition-colors duration-quick hover:bg-[var(--bg)]"
        >
          <span className="truncate text-body text-[var(--text)]">{it.label}</span>
          <span className="shrink-0 font-mono text-body tabular-nums text-[var(--text)]">{money(it.amount)}</span>
        </div>
      ))}
    </div>
  );
}

export function IncomeReport({
  total,
  months,
  tenants,
}: {
  total: number;
  months: MonthRow[];
  tenants: TenantRow[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-6">
        <span className="font-mono text-caption uppercase text-mute">Доходы за всё время</span>
        <p className="mt-2 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
          {money(total)}
        </p>
        <p className="mt-2 font-mono text-caption uppercase text-mute">не сбрасывается обнулением кассы</p>
      </div>

      {months.length === 0 ? (
        <p className="border-t border-[var(--line)] px-6 py-8 text-center text-body text-mute">
          Доходов пока нет.
        </p>
      ) : (
        <div className="border-t border-[var(--line)]">
          <Section
            title="По месяцам"
            items={months.map((m) => ({ id: m.key, label: cap(m.label), amount: m.amount }))}
          />
          <div className="border-t border-[var(--line)]">
            <Section
              title="По арендаторам"
              items={tenants.map((t) => ({ id: t.tenantId || t.name, label: t.name, amount: t.amount }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
