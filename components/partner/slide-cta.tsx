"use client";

// СЛАЙД 8 — ПЛАН ЗАКУПОК: РЕИНВЕСТ И РОСТ.
// Отвечает партнёру: сколько откладываем на 2-ю закупку, когда она и какого
// размера, план до 3-й. Без рублёвых цен закупки — в великах, долях прибыли
// и горизонте. Тёмный слайд, эхо финала инвест-дека.

import type { ReactNode } from "react";
import { R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

const WAVES: {
  n: string;
  when: string;
  fleet: string;
  note: ReactNode;
  source: string;
  peak?: boolean;
}[] = [
  {
    n: "Закупка 1",
    when: "сейчас",
    fleet: "15",
    note: <>5 продажа · 10 аренда</>,
    source: "капитал партнёра",
  },
  {
    n: "Закупка 2",
    when: "~1-й квартал",
    fleet: "~25–30",
    note: <>крупнее первой</>,
    source: "из накопленного резерва",
  },
  {
    n: "Закупка 3",
    when: "дальше",
    fleet: "~60",
    note: <>оборот растёт&nbsp;↻</>,
    source: "реинвест, без вливаний",
    peak: true,
  },
];

export function SlideCta() {
  return (
    <Slide id="cta" theme="dark">
      <Rise>
        <span className="flex items-center gap-3 font-mono text-caption uppercase text-mute">
          <span aria-hidden className="inline-block h-1.5 w-1.5 shrink-0 bg-volt" />
          <span className="text-[var(--text)]">09</span>
          <span>Дальше</span>
        </span>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 font-sans text-display-2">
        Дальше — реинвест и&nbsp;крупнее закупки<span className="text-volt">.</span>
      </Rise>
      <Rise delay={0.12} as="p" className="mt-5 max-w-[64ch] font-sans text-body-lg text-mute">
        Механизм простой:{" "}
        <span className="text-[var(--text)]">каждый арендный велик своими выплатами
        отбивает тело</span> — и&nbsp;на&nbsp;эти деньги берём следующий. Тело с&nbsp;продаж —
        так&nbsp;же в&nbsp;оборот. Парк удваивается без&nbsp;новых вливаний.
      </Rise>

      <SlideBody className="mt-8">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {WAVES.map((w, i) => {
            const peak = w.peak;
            return (
              <Rise key={w.n} delay={0.12 + i * 0.08}>
                <div
                  className={`flex h-full flex-col rounded-lg border p-6 sm:p-7 ${
                    peak
                      ? "border-volt bg-volt text-ink"
                      : "border-[var(--line)] bg-[var(--bg-2)]"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`font-mono text-caption uppercase ${peak ? "text-ink/70" : "text-volt"}`}>
                      {w.n}
                    </span>
                    <span className={`font-mono text-[10px] uppercase tracking-[0.06em] ${peak ? "text-ink/70" : "text-mute"}`}>
                      {w.when}
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className={`font-mono tnum text-[clamp(34px,4.4vw,58px)] leading-[0.85] tracking-tight ${peak ? "text-ink" : "text-[var(--text)]"}`}>
                      {w.fleet}
                    </span>
                    <span className={`font-mono text-caption uppercase ${peak ? "text-ink/70" : "text-mute"}`}>
                      великов
                    </span>
                  </div>
                  <p className={`mt-2 font-sans text-body leading-snug ${peak ? "text-ink/80" : "text-mute"}`}>
                    {w.note}
                  </p>
                  <span className={`mt-auto pt-5 font-mono text-caption uppercase leading-relaxed ${peak ? "text-ink/70" : "text-mute"}`}>
                    {w.source}
                  </span>
                </div>
              </Rise>
            );
          })}
        </div>

        {/* Горизонт словами — цифры примерные, зависят от загрузки. */}
        <Rise delay={0.16} className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <p className="border-l-2 border-volt pl-5 font-sans text-h3 leading-[1.2]">
            2&nbsp;000&nbsp;000&nbsp;<R /> — это вход. Дальше работает система, а&nbsp;не&nbsp;новые
            вливания.
          </p>
          <p className="font-sans text-body leading-snug text-mute">
            Первый месяц — первая партия реализована. В&nbsp;перспективе держим{" "}
            <span className="text-[var(--text)]">1,5–2&nbsp;млн&nbsp;<R /></span> оборотки
            магазина — постоянно крутятся в&nbsp;закупке-продаже.{" "}
            <span className="text-[var(--text)]">Партнёр входит один раз.</span>
          </p>
        </Rise>
      </SlideBody>

      <Rise delay={0.1} className="mt-8 border-t border-[var(--line)] pt-6 sm:mt-10">
        <p className="max-w-[68ch] font-mono text-caption uppercase leading-relaxed text-mute">
          Объёмы 2-й и&nbsp;3-й закупки — примерные, зависят от&nbsp;загрузки. Полное
          видение и&nbsp;горизонт на&nbsp;5&nbsp;лет —{" "}
          <a href="/invest" className="text-volt underline decoration-volt/40 underline-offset-4 hover:decoration-volt">
            в&nbsp;инвест-деке
          </a>
          .
        </p>
      </Rise>
    </Slide>
  );
}
