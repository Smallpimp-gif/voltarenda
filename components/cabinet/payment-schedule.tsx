"use client";

// График платежей арендатора. Прошедшие даты приглушены, ближайшая
// выделена volt, будущие обычные. При открытии список автоматически
// проматывается к ближайшему платежу — чтобы не искать его среди
// прошедших (особенно у выкупа на 36+ недель).

import { useEffect, useRef } from "react";
import type { ScheduleRow } from "@/lib/schedule";

const rub = new Intl.NumberFormat("ru-RU");

export function PaymentSchedule({
  rows,
  openEnded,
}: {
  rows: ScheduleRow[];
  openEnded: boolean; // аренда без срока — график показан окном
}) {
  const olRef = useRef<HTMLOListElement>(null);

  // Скроллим к ближайшему платежу, оставив пару прошедших сверху для контекста.
  useEffect(() => {
    const ol = olRef.current;
    if (!ol) return;
    const next = ol.querySelector<HTMLElement>("[data-next='true']");
    if (next) {
      // getBoundingClientRect — корректно вне зависимости от offsetParent.
      const delta =
        next.getBoundingClientRect().top -
        ol.getBoundingClientRect().top -
        ol.clientHeight * 0.28;
      ol.scrollTop = Math.max(0, ol.scrollTop + delta);
    }
  }, []);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-8">
      <ol ref={olRef} className="max-h-[420px] overflow-y-auto pr-1">
        {rows.map((r) => {
          const isNext = r.status === "next";
          const isPast = r.status === "past";
          return (
            <li
              key={r.number}
              data-next={isNext}
              className={`flex items-center justify-between gap-4 border-b border-[var(--line)] py-3 last:border-0 ${
                isPast ? "opacity-45" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                {/* Маркер статуса */}
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                    isNext
                      ? "bg-volt text-ink"
                      : isPast
                        ? "border border-[var(--line-strong)] text-mute"
                        : "border border-[var(--line-strong)] text-[var(--text)]"
                  }`}
                >
                  {isPast ? "✓" : r.number}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-body text-[var(--text)]">
                    {r.date}
                    <span className="ml-2 text-mute">{r.weekday}</span>
                  </p>
                  {isNext && (
                    <span className="mt-1 inline-block rounded-pill bg-volt px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
                      Ближайший платёж
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 text-body ${
                  isNext ? "font-semibold text-[var(--text)]" : "text-mute"
                }`}
              >
                {rub.format(r.amount)} ₽
              </span>
            </li>
          );
        })}
      </ol>

      {openEnded && (
        <p className="mt-4 font-mono text-caption uppercase text-mute">
          Далее — каждую неделю, бессрочно
        </p>
      )}
    </section>
  );
}
