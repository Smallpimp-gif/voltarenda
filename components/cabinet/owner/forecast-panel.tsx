"use client";

// Прогноз кассы: месячный доход + калькулятор «сколько должно быть собрано
// к выбранной дате». База — уже собранное в этом месяце (факт) плюс все
// запланированные недельные платежи по дату включительно. Интерактив
// (выбор даты) — клиентский, поэтому отдельный компонент.

import { useMemo, useState } from "react";
import type { PaymentEvent } from "@/lib/schedule";

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(Math.round(n))} ₽`;

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// «2026-07-31» → «31.07»
function shortLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

export function ForecastPanel({
  events,
  collectedThisMonth,
  monthlyIncome,
  todayISO,
  monthEndISO,
}: {
  events: PaymentEvent[];
  collectedThisMonth: number;
  monthlyIncome: number;
  todayISO: string;
  monthEndISO: string;
}) {
  const [target, setTarget] = useState(monthEndISO);
  // Не даём выбрать прошлое: клампим к сегодня.
  const t = target < todayISO ? todayISO : target;

  const due = useMemo(() => events.filter((e) => e.dateISO <= t), [events, t]);
  const upcomingSum = due.reduce((s, e) => s + e.amount, 0);
  const expected = collectedThisMonth + upcomingSum;
  const label = shortLabel(t);

  const preview = due.slice(0, 8);
  const rest = due.length - preview.length;

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)]">
      {/* Месячный доход — ожидаемая выручка со всех активных */}
      <div className="p-6">
        <p className="font-mono text-caption uppercase text-mute">Месячный доход</p>
        <p className="mt-2 font-sans text-display-2 leading-none tracking-tight tabular-nums text-[var(--text)]">
          {money(monthlyIncome)}
        </p>
        <p className="mt-3 font-mono text-caption uppercase text-mute">
          ≈ 4,3 недели · со всех активных
        </p>
      </div>

      {/* Калькулятор «к дате» */}
      <div className="border-t border-[var(--line)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption font-medium text-mute">
            Сколько должно быть собрано к дате
          </p>
          <input
            type="date"
            value={target}
            min={todayISO}
            onChange={(e) => setTarget(e.target.value || monthEndISO)}
            className="rounded-pill border border-[var(--line-strong)] bg-[var(--bg)] px-4 py-2 font-mono text-caption tabular-nums text-[var(--text)] outline-none transition-colors duration-quick focus:border-[var(--text)]"
          />
        </div>

        <p className="mt-4 font-sans text-h1 leading-none tracking-tight tabular-nums text-[var(--text)]">
          {money(expected)}
        </p>
        <p className="mt-2 text-caption text-mute">
          должно быть в кассе к {label} при оплате всех по графику
        </p>

        {/* Разбивка */}
        <div className="mt-5 flex flex-col gap-0 rounded-2xl border border-[var(--line)]">
          <Row label="Уже собрано в этом месяце" value={money(collectedThisMonth)} />
          <Row
            label={`Предстоит до ${label}`}
            sub={`${due.length} ${plural(due.length, "платёж", "платежа", "платежей")}`}
            value={`+${money(upcomingSum)}`}
            accent
            last
          />
        </div>
      </div>

      {/* Ближайшие платежи */}
      {preview.length > 0 && (
        <div className="border-t border-[var(--line)]">
          <p className="bg-[var(--bg)] px-6 py-2.5 text-caption font-medium text-mute">
            Ближайшие платежи
          </p>
          {preview.map((e, i) => (
            <div
              key={`${e.tenantId}-${e.dateISO}-${i}`}
              className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-6 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-body text-[var(--text)]">{e.name}</p>
                <p className="mt-0.5 font-mono text-caption uppercase text-mute">
                  {e.dateLabel} · {e.weekday}
                </p>
              </div>
              <span className="shrink-0 font-sans text-body font-medium tabular-nums text-[var(--text)]">
                {money(e.amount)}
              </span>
            </div>
          ))}
          {rest > 0 && (
            <p className="border-t border-[var(--line)] px-6 py-3 text-caption text-mute">
              и ещё {rest} {plural(rest, "платёж", "платежа", "платежей")} до {label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  sub,
  value,
  accent = false,
  last = false,
}: {
  label: string;
  sub?: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 ${
        last ? "" : "border-b border-[var(--line)]"
      }`}
    >
      <div className="min-w-0">
        <p className="text-body text-[var(--text)]">{label}</p>
        {sub && <p className="mt-0.5 text-caption text-mute">{sub}</p>}
      </div>
      <span
        className={`shrink-0 whitespace-nowrap font-sans text-body font-medium tabular-nums ${
          accent ? "text-[var(--text)]" : "text-mute"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
