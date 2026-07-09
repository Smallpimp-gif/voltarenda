"use client";

// Мобильная версия кабинета владельца — app-подобная: нижние вкладки
// (Обзор / Арендаторы / Настройки), крупный читаемый текст, список
// арендаторов на своей вкладке (без скролла мимо сводки). На десктопе
// рендерится отдельная раскладка (см. app/cabinet/owner/page.tsx).

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { BikesForm } from "./bikes-form";
import { TenantForm } from "./tenant-form";
import { TenantsTable, type TenantRow } from "./tenants-table";
import { LedgerPanel, type LedgerRow } from "./ledger-panel";
import { IncomeReport, type Entry as IncomeEntry } from "./income-report";
import { DepositsPanel, type DepositRow, type DepositLogRow } from "./deposits-panel";
import { ForecastPanel } from "./forecast-panel";
import type { Tenant, PaymentEvent } from "@/lib/schedule";
import type { MonthIncome, TenantIncome } from "@/lib/ledger";

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;

type Tab = "overview" | "tenants" | "ledger" | "settings";

export function OwnerMobile({
  email,
  rows,
  bikes,
  addOpen,
  editTenant,
  editPaidThrough,
  ledgerTotal,
  ledgerRows,
  ledgerResetAt,
  incomeTotal,
  incomeThisMonth,
  incomeMonths,
  incomeTenants,
  incomeRows,
  depositRows,
  depositLog,
  monthlyIncome,
  paymentEvents,
  todayISO,
  monthEndISO,
}: {
  email: string;
  rows: TenantRow[];
  bikes: number;
  addOpen: boolean;
  editTenant?: Tenant;
  editPaidThrough: number;
  ledgerTotal: number;
  ledgerRows: LedgerRow[];
  ledgerResetAt: string | null;
  incomeTotal: number;
  incomeThisMonth: number;
  incomeMonths: MonthIncome[];
  incomeTenants: TenantIncome[];
  incomeRows: IncomeEntry[];
  depositRows: DepositRow[];
  depositLog: DepositLogRow[];
  monthlyIncome: number;
  paymentEvents: PaymentEvent[];
  todayISO: string;
  monthEndISO: string;
}) {
  const [tab, setTab] = useState<Tab>("tenants");

  const active = rows.filter((r) => r.kind !== "done" && !r.paused);
  const weeklyIncome = active.reduce((s, r) => s + r.weekly, 0);
  const overdueRows = rows.filter((r) => r.kind === "overdue");
  const overdueSum = overdueRows.reduce((s, r) => s + r.overdueCount * r.weekly, 0);
  const todayRows = rows.filter((r) => r.kind === "today");
  const buyout = rows.filter((r) => r.totalWeeks != null).length;
  const attention = [...overdueRows, ...todayRows];

  return (
    <div className="min-h-dvh pb-[calc(140px+env(safe-area-inset-bottom))]">
      {/* Топ-бар */}
      <div className="border-b border-[var(--line)] px-gutter pb-4 pt-[max(16px,calc(env(safe-area-inset-top)+8px))]">
        <p className="font-mono text-caption uppercase text-mute">Кабинет владельца</p>
        <p className="mt-1 truncate text-body-lg font-medium text-[var(--text)]">{email}</p>
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-4 px-gutter py-6">
          {/* Требует внимания */}
          <section
            className={`rounded-[28px] border p-5 ${
              overdueRows.length ? "border-danger/50" : "border-[var(--line)]"
            }`}
          >
            <p className="text-caption font-medium text-mute">Требует внимания</p>
            {attention.length ? (
              <ul className="mt-3 flex flex-col">
                {attention.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-3 last:border-0">
                    <span className="truncate text-body-lg text-[var(--text)]">{r.name}</span>
                    <span
                      className={`shrink-0 rounded-pill px-2.5 py-1 font-mono text-caption uppercase ${
                        r.kind === "overdue" ? "bg-danger/15 text-danger" : "bg-volt text-ink"
                      }`}
                    >
                      {r.kind === "overdue" ? `Просрочено · ${r.overdueCount}` : "Сегодня"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-body-lg text-mute">Просрочек и платежей на сегодня нет</p>
            )}
          </section>

          {/* Метрики */}
          <section className="overflow-hidden rounded-[28px] border border-[var(--line)]">
            <Metric label="Просрочено" value={String(overdueRows.length)} hint={overdueRows.length ? `долг ${money(overdueSum)}` : "все оплатили"} danger={overdueRows.length > 0} />
            <Metric label="Доход за месяц" value={money(incomeThisMonth)} hint="оплачено в этом месяце" />
            <Metric label="Арендаторов" value={String(rows.length)} hint={`выкуп ${buyout} · аренда ${rows.length - buyout}`} />
            <Metric label="Недельный доход" value={money(weeklyIncome)} hint="ожидается со всех активных" />
            <Metric label="Свободно велосипедов" value={String(bikes)} hint="видно на сайте" last />
          </section>

          {/* Прогноз кассы: «сколько должно быть собрано к дате» */}
          <ForecastPanel
            events={paymentEvents}
            collectedThisMonth={incomeThisMonth}
            monthlyIncome={monthlyIncome}
            todayISO={todayISO}
            monthEndISO={monthEndISO}
          />

          <button
            type="button"
            onClick={() => setTab("tenants")}
            className="rounded-2xl border border-[var(--line-strong)] px-5 py-4 text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
          >
            Открыть список арендаторов →
          </button>
        </div>
      )}

      {tab === "tenants" && (
        <div className="px-gutter py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-h3 text-[var(--text)]">
              Арендаторы <span className="font-mono text-body text-mute">· {rows.length}</span>
            </h2>
            {!addOpen && !editTenant && (
              <Link
                href="/cabinet/owner?add=1"
                className="rounded-pill bg-volt px-5 py-3 text-caption font-semibold text-ink"
              >
                + Добавить
              </Link>
            )}
          </div>

          {addOpen && (
            <div className="mt-5">
              <TenantForm />
            </div>
          )}
          {editTenant && (
            <div className="mt-5">
              <TenantForm tenant={editTenant} paidThrough={editPaidThrough} />
            </div>
          )}

          <div className="mt-6">
            <TenantsTable rows={rows} />
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="flex flex-col gap-8 px-gutter py-6">
          <div>
            <h2 className="mb-3 text-h3 text-[var(--text)]">Касса</h2>
            <LedgerPanel total={ledgerTotal} rows={ledgerRows} lastResetAt={ledgerResetAt} />
          </div>
          <div>
            <h2 className="mb-3 text-h3 text-[var(--text)]">Доходы</h2>
            <IncomeReport
              total={incomeTotal}
              thisMonth={incomeThisMonth}
              months={incomeMonths}
              tenants={incomeTenants}
              entries={incomeRows}
            />
          </div>
          <div>
            <h2 className="mb-3 text-h3 text-[var(--text)]">Залоги</h2>
            <DepositsPanel rows={depositRows} log={depositLog} />
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="flex flex-col gap-5 px-gutter py-6">
          <BikesForm current={bikes} />
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-2xl border border-[var(--line-strong)] px-5 py-4 text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
            >
              Выйти
            </button>
          </form>
          <p className="text-body text-mute">
            Список — тот же, что читает Telegram-бот напоминаний. Повторный запуск
            Excel-импорта перезапишет список и удалит арендаторов, добавленных
            здесь. Если пользуетесь админкой — не запускайте импорт.
          </p>
        </div>
      )}

      {/* Нижняя навигация — плавающий скруглённый бар */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(30px,calc(env(safe-area-inset-bottom)+24px))] pt-2">
        <div className="mx-auto flex max-w-md items-center gap-1.5 rounded-[26px] border border-[var(--line)] bg-[var(--bg)]/80 p-1.5 backdrop-blur-xl">
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")} label="Обзор" icon={<GridIcon />} />
          <TabButton active={tab === "tenants"} onClick={() => setTab("tenants")} label="Арендаторы" icon={<UsersIcon />} />
          <TabButton active={tab === "ledger"} onClick={() => setTab("ledger")} label="Касса" icon={<CashIcon />} />
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")} label="Настройки" icon={<GearIcon />} />
        </div>
      </nav>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  last = false,
  danger = false,
}: {
  label: string;
  value: string;
  hint?: string;
  last?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 px-5 py-5 ${last ? "" : "border-b border-[var(--line)]"}`}>
      <div className="min-w-0">
        <p className="text-caption font-medium text-[var(--text)]">{label}</p>
        {hint && <p className="mt-0.5 text-caption text-mute">{hint}</p>}
      </div>
      <span className={`shrink-0 whitespace-nowrap font-sans text-h2 font-semibold tabular-nums ${danger ? "text-danger" : "text-[var(--text)]"}`}>
        {value}
      </span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-12 items-center justify-center gap-2 rounded-[20px] transition-all duration-quick ${
        active
          ? "flex-1 bg-[var(--text)] px-4 text-[var(--bg)]"
          : "w-12 shrink-0 text-mute hover:text-[var(--text)]"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      {active && (
        <span className="truncate text-caption font-semibold">{label}</span>
      )}
    </button>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-5 w-5",
};

function GridIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}
function CashIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9v6M18 9v6" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
