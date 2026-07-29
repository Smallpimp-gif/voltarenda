import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { buildCabinetView, buildSchedule } from "@/lib/schedule";
import { PaymentSchedule } from "@/components/cabinet/payment-schedule";
import { PaymentSetup } from "@/components/cabinet/payment-setup";
import { getSubscription } from "@/lib/subscriptions";
import { tochkaEnabled } from "@/lib/tochka";
import { payRentAction } from "@/lib/pay/tochka-actions";

const rub = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${rub.format(n)} ₽`;

function dueLabel(days: number): { text: string; danger: boolean } {
  if (days < 0) return { text: `просрочен на ${Math.abs(days)} дн.`, danger: true };
  if (days === 0) return { text: "сегодня", danger: true };
  if (days === 1) return { text: "завтра", danger: false };
  return { text: `через ${days} дн.`, danger: false };
}

// Нумерованный заголовок секции — фирменный приём лендинга.
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
        <span className="font-mono text-caption uppercase text-mute">{num} / {eyebrow}</span>
        <h2 className="font-sans text-h2">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-4 last:border-0">
      <span className="font-mono text-caption uppercase text-mute">{label}</span>
      <span className="text-body-lg font-medium text-[var(--text)]">{value}</span>
    </div>
  );
}

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; payfail?: string; pay?: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/cabinet/login");
  if (current.user.role === "owner") redirect("/cabinet/owner");
  if (!current.tenant) redirect("/cabinet/login"); // запись арендатора удалили

  const { user, tenant } = current;
  const sp = await searchParams;
  const v = buildCabinetView(tenant);
  const schedule = buildSchedule(tenant);
  const due = v.daysUntil !== null ? dueLabel(v.daysUntil) : null;
  const subscription = await getSubscription(tenant.id);
  const payOn = tochkaEnabled();
  const canPay = payOn && !v.completed && !v.paused && v.weekly > 0;
  // Контакт для чека: настоящий email аккаунта или ранее сохранённый.
  const realEmail = user.email && !user.email.endsWith("@telegram.local") ? user.email : "";
  const contactPrefill = realEmail || tenant.receiptContact || "";

  return (
    <div className="mx-auto w-full max-w-content px-gutter pb-14 pt-[max(3.5rem,calc(env(safe-area-inset-top)+1.5rem))]">
      {/* Шапка — editorial */}
      <header className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div className="min-w-0">
          <span className="font-mono text-caption uppercase text-mute">Личный кабинет</span>
          <h1 className="mt-3 font-sans text-display-2 leading-none tracking-tight">{tenant.name}</h1>
          <p className="mt-3 font-mono text-caption uppercase text-mute">
            Договор {tenant.contract} · {v.type === "выкуп" ? "выкуп" : "аренда"}
          </p>
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

      {/* Статус после возврата с оплаты */}
      {sp.paid && (
        <div className="mt-8 rounded-2xl border border-volt bg-volt/10 px-5 py-4 text-body text-[var(--text)]">
          Спасибо! Платёж обрабатывается — статус обновится, как только банк
          подтвердит зачисление (обычно пара минут).
        </div>
      )}
      {sp.payfail && (
        <div className="mt-8 rounded-2xl border border-danger/40 bg-danger/10 px-5 py-4 text-body text-danger">
          {sp.payfail === "contact"
            ? "Проверьте email или телефон для чека — формат не распознан."
            : "Оплата не прошла или была отменена. Попробуйте ещё раз."}
        </div>
      )}

      {/* 01 / Платёж */}
      <section className="mt-16">
        <SectionHeader
          num="01"
          eyebrow="Платёж"
          title={v.paused ? "Выкуп на паузе" : v.completed ? "Выкуп завершён" : "Следующий платёж"}
        >
          {v.paused ? (
            <span className="shrink-0 rounded-pill border border-dashed border-[var(--line-strong)] px-4 py-2 font-mono text-caption uppercase text-mute">
              на паузе
            </span>
          ) : (
            due && (
              <span
                className={`shrink-0 rounded-pill px-4 py-2 font-mono text-caption uppercase ${
                  due.danger ? "bg-danger/10 text-danger" : "bg-volt text-ink"
                }`}
              >
                {due.text}
              </span>
            )
          )}
        </SectionHeader>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Сумма / следующий платёж */}
          <div
            className={`flex min-h-[200px] flex-col justify-between rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)] p-8 ${
              v.isBuyout ? "" : "lg:col-span-2"
            }`}
          >
            {v.paused ? (
              <>
                <span className="font-mono text-caption uppercase text-mute">Пауза выкупа</span>
                <div>
                  <p className="font-sans text-display-1 leading-none tracking-tight tabular-nums text-[var(--text)]">
                    {money(v.pauseFee ?? 0)}
                    <span className="text-mute"> / мес</span>
                  </p>
                  <p className="mt-4 text-body-lg text-mute">
                    Оплачивается отдельно. Выкупная сумма на паузе не уменьшается —
                    график продолжится после снятия паузы.
                  </p>
                </div>
              </>
            ) : v.completed ? (
              <>
                <span className="font-mono text-caption uppercase text-mute">Статус</span>
                <p className="font-sans text-h2 text-[var(--text)]">Выкуп выплачен полностью</p>
              </>
            ) : (
              <>
                <span className="font-mono text-caption uppercase text-mute">Сумма к оплате</span>
                <div>
                  <p className="font-sans text-display-1 leading-none tracking-tight tabular-nums text-[var(--text)]">
                    {money(v.weekly)}
                  </p>
                  <p className="mt-4 text-body-lg text-mute">
                    {v.nextDate}
                    {v.nextWeekday ? `, ${v.nextWeekday}` : ""}
                    {v.isBuyout && v.nextNumber ? ` · платёж ${v.nextNumber} из ${v.buyoutWeeks}` : ""}
                  </p>
                  {canPay && (
                    <form action={payRentAction} className="mt-6 flex flex-col gap-3">
                      <input
                        name="contact"
                        type="text"
                        inputMode="email"
                        required
                        defaultValue={contactPrefill}
                        placeholder="Email или телефон для чека"
                        className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--bg)] px-4 py-3 text-body text-[var(--text)] outline-none transition-colors duration-quick placeholder:text-mute focus:border-volt sm:max-w-sm"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-pill bg-volt px-6 py-4 font-mono text-caption uppercase text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-[0.98] sm:w-auto"
                      >
                        Оплатить {money(v.weekly)} →
                      </button>
                      <span className="font-mono text-caption uppercase text-mute">
                        СБП или карта · чек придёт на указанный контакт
                      </span>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Прогресс выкупа */}
          {v.isBuyout && (
            <div className="flex min-h-[200px] flex-col justify-between rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)] p-8">
              <span className="font-mono text-caption uppercase text-mute">Прогресс выкупа</span>
              <div>
                <p className="font-sans text-display-2 leading-none tabular-nums text-[var(--text)]">
                  {v.paidCount}
                  <span className="text-mute"> / {v.buyoutWeeks}</span>
                </p>
                <div className="mt-5 h-2 w-full overflow-hidden rounded-pill bg-[var(--line)]">
                  <div
                    className="h-full rounded-pill bg-volt"
                    style={{ width: `${v.progressPct}%` }}
                  />
                </div>
                <p className="mt-4 text-body text-mute">
                  Осталось {v.remainingWeeks} нед. ·{" "}
                  <span className="text-[var(--text)]">{money(v.remainingAmount ?? 0)}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 02 / Автосписание */}
      {!v.completed && (
        <section className="mt-20">
          <SectionHeader num="02" eyebrow="Оплата" title="Автосписание" />
          <div className="mt-8">
            <PaymentSetup
              tenantId={tenant.id}
              tenantName={tenant.name}
              email={user.email}
              weekly={v.weekly}
              mode={v.type === "выкуп" ? "buyout" : "rent"}
              weeksLeft={v.remainingWeeks ?? null}
              nextDate={v.nextDate ?? "—"}
              subscription={subscription}
            />
          </div>
        </section>
      )}

      {/* 03 / Договор */}
      <section className="mt-20">
        <SectionHeader num="03" eyebrow="Договор" title="Условия аренды" />
        <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-8">
          <Row label="Номер договора" value={tenant.contract} />
          <Row label="Тип" value={v.type === "выкуп" ? "Выкуп" : "Аренда"} />
          <Row label="Недельный платёж" value={money(v.weekly)} />
          {v.isBuyout && v.buyoutSum != null && (
            <Row label="Выкупная сумма" value={money(v.buyoutSum)} />
          )}
          {v.positions.map((p, i) => (
            <Row
              key={i}
              label={`Доп: ${p.name}`}
              value={`${money(p.cost)} · +${money(p.weekly)}/нед`}
            />
          ))}
          <Row label="Дата заезда" value={v.startDate} />
          <Row label="Email" value={user.email} />
        </div>
      </section>

      {/* 03 / График */}
      <section className="mt-20">
        <SectionHeader num="04" eyebrow="График" title="Все платежи" />
        <div className="mt-8">
          <PaymentSchedule rows={schedule} openEnded={!v.isBuyout} />
        </div>
      </section>

      {/* Напоминания через бота */}
      <p className="mt-10 max-w-[60ch] text-body text-mute">
        Напоминания о платежах приходят в Telegram-боте{" "}
        <a
          href="https://t.me/voltarenda_bot"
          className="text-[var(--text)] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          @voltarenda_bot
        </a>
        . Напишите ему «Старт», чтобы подключить.
      </p>
    </div>
  );
}
