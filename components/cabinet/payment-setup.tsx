"use client";

// Экран автосписания в кабинете арендатора.
//
// Два состояния:
//   1) карта не привязана — кнопка «Привязать карту», открывается виджет
//      CloudPayments (номер карты и 3-D Secure — на их стороне, к нам
//      реквизиты карты не попадают вообще);
//   2) карта привязана — показываем •••• и когда спишется следующий раз.
//
// Виджету передаём recurrent-настройки: CloudPayments сам заводит подписку
// после первого успешного платежа и дальше списывает раз в неделю. Каждое
// списание прилетает к нам в /api/cloudpayments/webhook и попадает в учёт.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type Sub = {
  cardLastFour?: string;
  cardType?: string;
  weekly: number;
  status: "active" | "cancelled";
} | null;

declare global {
  interface Window {
    cp?: { CloudPayments: new () => CpWidget };
  }
}
type CpWidget = {
  charge: (
    options: Record<string, unknown>,
    onSuccess: (opts: unknown) => void,
    onFail: (reason: string, opts: unknown) => void,
  ) => void;
};

const WIDGET_SRC = "https://widget.cloudpayments.ru/bundles/cloudpayments.js";

function loadWidget(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.cp) return resolve();
    const existing = document.querySelector<HTMLScriptElement>("script[data-cp]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script")));
      return;
    }
    const s = document.createElement("script");
    s.src = WIDGET_SRC;
    s.async = true;
    s.dataset.cp = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script"));
    document.head.appendChild(s);
  });
}

const rub = new Intl.NumberFormat("ru-RU");

export function PaymentSetup({
  tenantId,
  tenantName,
  email,
  weekly,
  mode,
  weeksLeft,
  nextDate,
  subscription,
}: {
  tenantId: string;
  tenantName: string;
  email?: string;
  weekly: number;
  mode: "rent" | "buyout";
  weeksLeft: number | null;
  nextDate: string;
  subscription: Sub;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const publicId = process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID;

  const start = useCallback(async () => {
    if (!publicId) return;
    setState("loading");
    setMessage(null);
    try {
      await loadWidget();
      const widget = new window.cp!.CloudPayments();
      widget.charge(
        {
          publicId,
          description: `Вольтаренда — ${mode === "buyout" ? "выкуп" : "аренда"}, платёж за неделю`,
          amount: weekly,
          currency: "RUB",
          accountId: tenantId, // вернётся в вебхуке — по нему зачтём платёж
          email,
          skin: "mini",
          data: {
            tenantName,
            cloudPayments: {
              // CloudPayments сам заведёт подписку после первого платежа
              recurrent: {
                interval: "Week",
                period: 1,
                amount: weekly,
                ...(mode === "buyout" && weeksLeft ? { maxPeriods: weeksLeft } : {}),
              },
            },
          },
        },
        () => {
          // Платёж прошёл. Подписка и зачёт придут вебхуком — обновляем экран.
          setState("idle");
          router.refresh();
        },
        (reason) => {
          setState("error");
          setMessage(reason || "Платёж не прошёл. Попробуйте другую карту.");
        },
      );
    } catch {
      setState("error");
      setMessage("Не удалось загрузить платёжную форму. Проверьте интернет.");
    }
  }, [publicId, weekly, mode, weeksLeft, tenantId, tenantName, email, router]);

  const active = subscription?.status === "active";

  return (
    <div className="rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)] p-8">
      {active ? (
        <>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-volt" />
            <span className="font-mono text-caption uppercase text-mute">
              Автосписание включено
            </span>
          </div>
          <p className="mt-5 font-sans text-h2 text-[var(--text)]">
            {rub.format(subscription!.weekly)} ₽ каждую неделю
          </p>
          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <Row
              label="Карта"
              value={`${subscription!.cardType ?? "Карта"} •••• ${subscription!.cardLastFour ?? "____"}`}
            />
            <Row label="Следующее списание" value={nextDate} />
            {mode === "buyout" && weeksLeft !== null && (
              <Row label="Осталось списаний" value={`${weeksLeft}`} />
            )}
          </div>
          <p className="mt-5 font-mono text-caption uppercase text-mute">
            Деньги списываются сами — ничего делать не нужно. Чтобы поменять
            карту, напишите в поддержку.
          </p>
        </>
      ) : (
        <>
          <span className="font-mono text-caption uppercase text-mute">Автосписание</span>
          <p className="mt-5 font-sans text-h2 text-[var(--text)]">Привяжите карту</p>
          <p className="mt-4 max-w-[46ch] text-body-lg text-mute">
            Платёж {rub.format(weekly)} ₽ будет списываться раз в неделю
            автоматически. Не придётся помнить о сроках и платить вручную.
          </p>

          <ul className="mt-6 flex flex-col gap-2">
            <Bullet>Первое списание — сегодня, дальше раз в неделю</Bullet>
            <Bullet>
              {mode === "buyout"
                ? `Всего ${weeksLeft ?? "—"} списаний, потом велосипед ваш`
                : "Списания идут, пока действует аренда"}
            </Bullet>
            <Bullet>Данные карты вводятся на стороне банка — мы их не видим</Bullet>
          </ul>

          {publicId ? (
            <button
              type="button"
              onClick={start}
              disabled={state === "loading"}
              className="btn-cta btn-cta-volt mt-8 w-full rounded-md bg-volt px-8 py-5 font-mono text-caption uppercase text-ink hover:bg-volt-hover disabled:opacity-60 sm:w-auto"
            >
              {state === "loading"
                ? "Открываем форму…"
                : `Привязать карту и оплатить ${rub.format(weekly)} ₽`}
            </button>
          ) : (
            <div className="mt-8 rounded-md border border-[var(--line-strong)] px-5 py-4">
              <p className="font-mono text-caption uppercase text-mute">
                Платёжная система не подключена
              </p>
              <p className="mt-2 text-body text-mute">
                Не заданы ключи CloudPayments. Оплата появится здесь, как только
                их добавят в настройки.
              </p>
            </div>
          )}

          {message && (
            <p role="alert" className="mt-4 font-mono text-caption text-[#ff6b6b]">
              {message}
            </p>
          )}
        </>
      )}
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-body text-mute">
      <span aria-hidden className="mt-1 shrink-0 leading-none text-volt">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
