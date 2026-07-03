// Доходы — постоянная сводка: всего, за текущий месяц, по месяцам и по
// арендаторам. Обнуление кассы её не сбрасывает. Каждую строку месяца/
// арендатора можно раскрыть до отдельных платежей — видно, из чего
// складывается сумма. Раскрытие на нативном <details>, без клиента.

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const fmtDate = (iso: string) => dateFmt.format(new Date(iso));

export type MonthRow = { key: string; label: string; amount: number; weeks: number };
export type TenantRow = { tenantId: string; name: string; amount: number; weeks: number };
// Отдельная оплата (для раскрытия строки).
export type Entry = { id: string; tenantId: string; name: string; amount: number; at: string };

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Item = { id: string; label: string; sub: string; amount: number; entries: Entry[] };

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-mute transition-transform duration-quick group-open:rotate-180"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// Одна раскрываемая строка: заголовок (месяц/арендатор) + вложенный список
// платежей. `detail` — как подписать каждую оплату (для месяца — фамилия,
// для арендатора — месяц/дата).
function Row({ it, detail }: { it: Item; detail: (e: Entry) => string }) {
  return (
    <details className="group border-t border-[var(--line)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="truncate text-body text-[var(--text)]">{it.label}</p>
          <p className="mt-0.5 text-caption text-mute">{it.sub}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="font-sans text-body font-medium tabular-nums text-[var(--text)]">
            {money(it.amount)}
          </span>
          <ChevronIcon />
        </span>
      </summary>
      <div className="bg-[var(--bg)]">
        {it.entries.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between gap-3 border-t border-[var(--line)] py-2.5 pl-8 pr-5"
          >
            <span className="truncate font-mono text-caption uppercase text-mute">
              {detail(e)}
            </span>
            <span className="shrink-0 font-sans text-caption tabular-nums text-[var(--text)]">
              {money(e.amount)}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

function Section({
  title,
  items,
  detail,
}: {
  title: string;
  items: Item[];
  detail: (e: Entry) => string;
}) {
  return (
    <div>
      <p className="bg-[var(--bg)] px-5 py-2.5 text-caption font-medium text-mute">{title}</p>
      {items.map((it) => (
        <Row key={it.id} it={it} detail={detail} />
      ))}
    </div>
  );
}

export function IncomeReport({
  total,
  thisMonth,
  months,
  tenants,
  entries,
}: {
  total: number;
  thisMonth: number;
  months: MonthRow[];
  tenants: TenantRow[];
  entries: Entry[];
}) {
  // Раскладка платежей по месяцу и по арендатору (новые сверху).
  const byMonth = new Map<string, Entry[]>();
  const byTenant = new Map<string, Entry[]>();
  const monthKey = (at: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
    }).format(new Date(at));
  for (const e of [...entries].sort((a, b) => (a.at < b.at ? 1 : -1))) {
    const mk = monthKey(e.at);
    (byMonth.get(mk) ?? byMonth.set(mk, []).get(mk)!).push(e);
    const tk = e.tenantId || e.name;
    (byTenant.get(tk) ?? byTenant.set(tk, []).get(tk)!).push(e);
  }

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
            title="По месяцам · нажмите, чтобы раскрыть"
            detail={(e) => `${fmtDate(e.at)} · ${e.name}`}
            items={months.map((m) => ({
              id: m.key,
              label: cap(m.label),
              sub: `${m.weeks} ${plural(m.weeks, "оплата", "оплаты", "оплат")}`,
              amount: m.amount,
              entries: byMonth.get(m.key) ?? [],
            }))}
          />
          <div className="border-t border-[var(--line)]">
            <Section
              title="По арендаторам · нажмите, чтобы раскрыть"
              detail={(e) => fmtDate(e.at)}
              items={tenants.map((t) => ({
                id: t.tenantId || t.name,
                label: t.name,
                sub: `${t.weeks} ${plural(t.weeks, "оплата", "оплаты", "оплат")}`,
                amount: t.amount,
                entries: byTenant.get(t.tenantId || t.name) ?? [],
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
