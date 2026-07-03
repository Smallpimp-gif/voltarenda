import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { loadTenants } from "@/lib/auth/tenants";
import { getAvailableBikes } from "@/lib/settings";
import {
  paymentState,
  effectiveWeekly,
  depositOf,
  upcomingPaymentEvents,
  mskDayNum,
  dayNumToIso,
} from "@/lib/schedule";
import {
  DepositsPanel,
  type DepositRow,
} from "@/components/cabinet/owner/deposits-panel";
import { loadPaymentMap } from "@/lib/payments";
import {
  loadLedger,
  cassaTotal,
  cassaEntries,
  incomeTotal,
  incomeThisMonth,
  incomeByMonth,
  incomeByTenant,
} from "@/lib/ledger";
import {
  LedgerPanel,
  type LedgerRow,
} from "@/components/cabinet/owner/ledger-panel";
import { IncomeReport } from "@/components/cabinet/owner/income-report";
import { BikesForm } from "@/components/cabinet/owner/bikes-form";
import { TenantForm } from "@/components/cabinet/owner/tenant-form";
import {
  TenantsTable,
  type TenantRow,
} from "@/components/cabinet/owner/tenants-table";
import { ForecastPanel } from "@/components/cabinet/owner/forecast-panel";
import { OwnerMobile } from "@/components/cabinet/owner/owner-mobile";

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;

// Карточка-метрика в стиле лендинга: высокая, число снизу крупным display,
// label сверху (justify-between), как карточки «01/02/03» в how-it-works.
function StatCard({
  label,
  value,
  sub,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  const border = danger ? "border-danger/50" : accent ? "border-volt" : "border-[var(--line)]";
  const dot = danger ? "bg-danger" : "bg-volt";
  return (
    <div className={`flex min-h-[172px] flex-col justify-between rounded-[28px] border bg-[var(--bg-2)] p-6 ${border}`}>
      <span className="flex items-center gap-2 font-mono text-caption uppercase text-mute">
        {(accent || danger) && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        {label}
      </span>
      <div>
        <p
          className={`whitespace-nowrap font-sans text-display-2 leading-none tracking-tight tabular-nums ${
            danger ? "text-danger" : "text-[var(--text)]"
          }`}
        >
          {value}
        </p>
        {sub && <p className="mt-3 font-mono text-caption uppercase text-mute">{sub}</p>}
      </div>
    </div>
  );
}

// Нумерованный заголовок секции — фирменный приём лендинга
// (эйбрау «01 / СЕКЦИЯ» + крупный h2 + нижняя линия).
function SectionHeader({
  num,
  eyebrow,
  title,
  children,
}: {
  num: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-caption uppercase text-mute">
          {num} / {eyebrow}
        </span>
        <h2 className="font-sans text-h2">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string; edit?: string }>;
}) {
  const cu = await getCurrentUser();
  if (!cu) redirect("/cabinet/owner/login");
  if (cu.user.role !== "owner") redirect("/cabinet");

  // Для входа через Telegram email синтетический (tg<id>@telegram.local) —
  // не показываем его, пишем «Владелец».
  const ownerLabel = cu.user.email.endsWith("@telegram.local")
    ? "Владелец"
    : cu.user.email;

  const sp = await searchParams;
  const [tenants, bikes, payMap, ledger] = await Promise.all([
    loadTenants(),
    getAvailableBikes(),
    loadPaymentMap(),
    loadLedger(),
  ]);
  const cassaSum = cassaTotal(ledger);
  const ledgerRows: LedgerRow[] = [...cassaEntries(ledger)].reverse().map((e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    weeks: e.weeks,
    kind: e.kind,
    at: e.at,
  }));
  const incomeSum = incomeTotal(ledger);
  const incomeMonth = incomeThisMonth(ledger);
  const incomeMonths = incomeByMonth(ledger);
  const incomeTenants = incomeByTenant(ledger);
  // Залоги — по убыванию (с залогом сверху).
  const depositRows: DepositRow[] = tenants
    .map((t) => ({ id: t.id, name: t.name, deposit: depositOf(t) }))
    .sort((a, b) => b.deposit - a.deposit || a.name.localeCompare(b.name, "ru"));
  const editTenant = sp.edit ? tenants.find((t) => t.id === sp.edit) : undefined;
  const editPaidThrough = editTenant ? (payMap[editTenant.id]?.paidThrough ?? 0) : 0;

  // Строки таблицы со статусом оплат (учёт отметок владельца).
  const rows: TenantRow[] = tenants.map((t) => {
    const rec = payMap[t.id];
    const ps = paymentState(t, rec?.paidThrough ?? 0, undefined, rec?.partialPaid ?? 0);
    return {
      id: t.id,
      name: t.name,
      contract: t.contract,
      type: t.type,
      weekly: effectiveWeekly(t),
      telegramUsername: t.telegramUsername ?? "",
      paidThrough: ps.paidThrough,
      totalWeeks: ps.totalWeeks,
      overdueCount: ps.overdueCount,
      nextNumber: ps.nextNumber,
      nextDate: ps.nextDate,
      nextWeekday: ps.nextWeekday,
      nextDaysUntil: ps.nextDaysUntil,
      kind: ps.kind,
      paused: ps.paused,
      pauseFee: ps.pauseFee,
      partialDebt: ps.partialDebt,
      referralWeeks: rec?.referralWeeks ?? 0,
    };
  });

  // Сводка.
  const buyoutCount = tenants.filter((t) => t.buyoutWeeks).length;
  const rentCount = tenants.length - buyoutCount;
  // Недельный доход — с активных, кроме завершённых и тех, кто на паузе
  // (на паузе платят фикс. за паузу, а не недельные).
  const activeRows = rows.filter((r) => r.kind !== "done" && !r.paused);
  const weeklyIncome = activeRows.reduce((s, r) => s + r.weekly, 0);
  const overdueRows = rows.filter((r) => r.kind === "overdue");
  const overdueCount = overdueRows.length;
  const overdueSum = overdueRows.reduce((s, r) => s + r.overdueCount * r.weekly, 0);
  // Месячный доход ≈ недельный × 52/12 (усреднённая выручка в месяц).
  const monthlyIncome = Math.round((weeklyIncome * 52) / 12);
  // Прогноз кассы «к дате»: график будущих платежей + границы (сегодня,
  // конец текущего месяца по МСК) для калькулятора.
  const todayNum = mskDayNum();
  const todayISO = dayNumToIso(todayNum);
  const [ty, tm] = todayISO.split("-").map(Number);
  const monthEndISO = dayNumToIso(
    Math.floor(Date.UTC(ty, tm, 0) / 86400000), // день 0 след. месяца = последний день текущего
  );
  const paymentEvents = upcomingPaymentEvents(tenants, 92, todayNum);

  return (
    <>
    {/* Мобильная версия — app-подобные вкладки снизу */}
    <div className="md:hidden">
      <OwnerMobile
        email={ownerLabel}
        rows={rows}
        bikes={bikes}
        addOpen={Boolean(sp.add)}
        editTenant={editTenant}
        editPaidThrough={editPaidThrough}
        ledgerTotal={cassaSum}
        ledgerRows={ledgerRows}
        ledgerResetAt={ledger.lastResetAt}
        incomeTotal={incomeSum}
        incomeThisMonth={incomeMonth}
        incomeMonths={incomeMonths}
        incomeTenants={incomeTenants}
        depositRows={depositRows}
        monthlyIncome={monthlyIncome}
        paymentEvents={paymentEvents}
        todayISO={todayISO}
        monthEndISO={monthEndISO}
      />
    </div>

    {/* Десктопная версия */}
    <div className="mx-auto hidden w-full max-w-content px-gutter py-14 md:block">
      {/* Шапка — editorial */}
      <header className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div className="min-w-0">
          <span className="font-mono text-caption uppercase text-mute">Кабинет владельца</span>
          <h1 className="mt-3 font-sans text-display-2 leading-none tracking-tight">Вольтаренда</h1>
          <p className="mt-3 truncate font-mono text-caption uppercase text-mute">{ownerLabel}</p>
        </div>
        <form action={logoutAction} className="shrink-0">
          <button
            type="submit"
            className="rounded-pill border border-[var(--line-strong)] px-5 py-2.5 font-mono text-caption uppercase text-mute transition-colors duration-quick hover:border-[var(--text)] hover:text-[var(--text)]"
          >
            Выйти
          </button>
        </form>
      </header>

      {/* 01 / Сводка */}
      <section className="mt-16">
        <SectionHeader num="01" eyebrow="Сводка" title="Бизнес в цифрах">
          <span className="hidden font-mono text-caption uppercase text-mute lg:inline">
            {tenants.length} активных договоров
          </span>
        </SectionHeader>
        <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
          <StatCard
            label="Арендаторов"
            value={String(tenants.length)}
            sub={`выкуп ${buyoutCount} · аренда ${rentCount}`}
          />
          <StatCard
            label="Недельный доход"
            value={money(weeklyIncome)}
            sub="со всех активных"
          />
          <StatCard
            label="Просрочено"
            value={overdueCount > 0 ? String(overdueCount) : "0"}
            sub={overdueCount > 0 ? `долг ${money(overdueSum)}` : "все оплатили"}
            danger={overdueCount > 0}
          />
          <BikesForm current={bikes} variant="metric" />
        </div>

        {/* Прогноз кассы: месячный доход + «сколько должно быть к дате» */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ForecastPanel
            events={paymentEvents}
            collectedThisMonth={incomeMonth}
            monthlyIncome={monthlyIncome}
            todayISO={todayISO}
            monthEndISO={monthEndISO}
          />
        </div>
      </section>

      {/* 02 / Арендаторы */}
      <section className="mt-20">
        <SectionHeader num="02" eyebrow="Арендаторы" title="Договоры и платежи">
          {!sp.add && !sp.edit && (
            <Link
              href="/cabinet/owner?add=1"
              className="shrink-0 rounded-pill bg-volt px-5 py-2.5 font-mono text-caption uppercase text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
            >
              + Добавить
            </Link>
          )}
        </SectionHeader>

        {/* Форма добавления / редактирования (поверх таблицы) */}
        {sp.add && (
          <div className="mt-8">
            <TenantForm />
          </div>
        )}
        {editTenant && (
          <div className="mt-8">
            <TenantForm tenant={editTenant} paidThrough={editPaidThrough} />
          </div>
        )}

        {/* Таблица */}
        {tenants.length === 0 ? (
          !sp.add && (
            <p className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-8 text-body text-mute">
              Пока нет арендаторов. Нажмите «Добавить».
            </p>
          )
        ) : (
          <div className="mt-8">
            <TenantsTable rows={rows} />
          </div>
        )}

        {/* Подсказка про Excel-импорт */}
        <p className="mt-10 max-w-[70ch] text-body text-mute">
          Список — тот же, что читает Telegram-бот напоминаний. Повторный запуск
          Excel-импорта (<span className="font-mono">bot/import-tenants.py</span>)
          перезапишет список и удалит арендаторов, добавленных здесь. Если
          пользуетесь админкой — не запускайте импорт.
        </p>
      </section>

      {/* 03 / Касса */}
      <section className="mt-20">
        <SectionHeader num="03" eyebrow="Касса" title="Собранные оплаты">
          <span className="hidden font-mono text-caption uppercase text-mute lg:inline">
            обнуление не трогает прогресс выкупа
          </span>
        </SectionHeader>
        <div className="mt-8">
          <LedgerPanel total={cassaSum} rows={ledgerRows} lastResetAt={ledger.lastResetAt} />
        </div>
      </section>

      {/* 04 / Доходы */}
      <section className="mt-20">
        <SectionHeader num="04" eyebrow="Доходы" title="Сколько заработано">
          <span className="hidden font-mono text-caption uppercase text-mute lg:inline">
            вся история · не сбрасывается
          </span>
        </SectionHeader>
        <div className="mt-8">
          <IncomeReport
            total={incomeSum}
            thisMonth={incomeMonth}
            months={incomeMonths}
            tenants={incomeTenants}
          />
        </div>
      </section>

      {/* 05 / Залоги */}
      <section className="mt-20">
        <SectionHeader num="05" eyebrow="Залоги" title="Удержанные залоги">
          <span className="hidden font-mono text-caption uppercase text-mute lg:inline">
            по умолчанию 5 000 ₽
          </span>
        </SectionHeader>
        <div className="mt-8">
          <DepositsPanel rows={depositRows} />
        </div>
      </section>
    </div>
    </>
  );
}
