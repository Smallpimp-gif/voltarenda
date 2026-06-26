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
import type { Tenant } from "@/lib/schedule";

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;

type Tab = "overview" | "tenants" | "ledger" | "settings";

export function OwnerMobile({
  email,
  rows,
  bikes,
  addOpen,
  editTenant,
  ledgerTotal,
  ledgerRows,
  ledgerResetAt,
}: {
  email: string;
  rows: TenantRow[];
  bikes: number;
  addOpen: boolean;
  editTenant?: Tenant;
  ledgerTotal: number;
  ledgerRows: LedgerRow[];
  ledgerResetAt: string | null;
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
    <div className="min-h-dvh pb-[calc(72px+env(safe-area-inset-bottom))]">
      {/* Топ-бар */}
      <div className="border-b border-[var(--line)] px-gutter py-4">
        <p className="font-mono text-caption uppercase text-mute">Кабинет владельца</p>
        <p className="mt-1 truncate text-body-lg font-medium text-[var(--text)]">{email}</p>
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-4 px-gutter py-6">
          {/* Требует внимания */}
          <section
            className={`rounded-lg border p-5 ${
              overdueRows.length ? "border-danger/50" : "border-[var(--line)]"
            }`}
          >
            <p className="font-mono text-caption uppercase text-mute">Требует внимания</p>
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
          <section className="rounded-lg border border-[var(--line)]">
            <Metric label="Просрочено" value={String(overdueRows.length)} hint={overdueRows.length ? `долг ${money(overdueSum)}` : "все оплатили"} danger={overdueRows.length > 0} />
            <Metric label="Арендаторов" value={String(rows.length)} hint={`выкуп ${buyout} · аренда ${rows.length - buyout}`} />
            <Metric label="Недельный доход" value={money(weeklyIncome)} hint="со всех активных" />
            <Metric label="Свободно велосипедов" value={String(bikes)} hint="видно на сайте" last />
          </section>

          <button
            type="button"
            onClick={() => setTab("tenants")}
            className="rounded-md border border-[var(--line-strong)] px-5 py-4 font-mono text-caption uppercase text-mute transition-colors duration-quick hover:text-[var(--text)]"
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
                className="rounded-pill bg-volt px-5 py-3 font-mono text-caption uppercase text-ink"
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
              <TenantForm tenant={editTenant} />
            </div>
          )}

          <div className="mt-6">
            <TenantsTable rows={rows} />
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="px-gutter py-6">
          <h2 className="text-h3 text-[var(--text)]">Касса</h2>
          <p className="mt-1 font-mono text-caption uppercase text-mute">Собранные оплаты</p>
          <div className="mt-5">
            <LedgerPanel total={ledgerTotal} rows={ledgerRows} lastResetAt={ledgerResetAt} />
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="flex flex-col gap-5 px-gutter py-6">
          <BikesForm current={bikes} />
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-md border border-[var(--line-strong)] px-5 py-4 font-mono text-caption uppercase text-mute transition-colors duration-quick hover:text-[var(--text)]"
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

      {/* Нижняя навигация */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
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
        <p className="font-mono text-caption uppercase text-mute">{label}</p>
        {hint && <p className="mt-1 font-mono text-caption uppercase text-mute opacity-70">{hint}</p>}
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
      className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-quick ${
        active ? "text-[var(--text)]" : "text-mute"
      }`}
    >
      <span className={`flex h-6 w-6 items-center justify-center ${active ? "text-[var(--text)]" : "text-mute"}`}>{icon}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.06em]">{label}</span>
      <span className={`mt-0.5 h-0.5 w-6 rounded-full ${active ? "bg-volt" : "bg-transparent"}`} />
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
