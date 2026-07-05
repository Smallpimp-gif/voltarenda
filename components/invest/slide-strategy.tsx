"use client";

// СЛАЙД 5 — СТРАТЕГИЯ ЗАХВАТА: АРЕНДА → БРЕНД → КИТАЙ → МИР.
// Главный слайд про видение. Аренда — инструмент захвата, бренд + Китай —
// то, что взрывает прибыль. Тёмный слайд, азарт и масштаб.

import type { ReactNode } from "react";
import { Eyebrow, Punch, R, Rise, Slide, SlideBody } from "./primitives";
import styles from "./invest.module.css";

const STEPS: {
  n: string;
  title: string;
  desc: ReactNode;
  pct: number;
  tone: "mute" | "rise" | "peak";
  pivot?: boolean;
}[] = [
  { n: "01", title: "Сейчас", desc: <>Аренда + выкуп через дарксторы. Лучшая цена, база.</>, pct: 30, tone: "mute" },
  { n: "02", title: "Города", desc: <>СПб и дальше. Партнёры-директора — до&nbsp;250 курьеров.</>, pct: 46, tone: "mute" },
  { n: "03", title: "Китай", desc: <>OEM под своим брендом. Себестоимость ↓ — маржа ↑.</>, pct: 64, tone: "peak", pivot: true },
  { n: "04", title: "Бренд", desc: <>Видео, пиар, сарафан. «Как айфон в&nbsp;нише».</>, pct: 82, tone: "mute" },
  { n: "05", title: "Мир", desc: <>Масштаб за&nbsp;пределы РФ. Глобальный горизонт.</>, pct: 100, tone: "mute" },
];

export function SlideStrategy() {
  return (
    <Slide id="strategy" theme="dark">
      <Rise>
        <Eyebrow index="06">Стратегия захвата</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[22ch] font-sans text-display-2">
        Мы не прокат. Мы бренд, который захватывает рынок.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[54ch] font-sans text-body-lg text-mute">
        Аренда/выкуп — не конечная цель, а&nbsp;быстрый способ зайти и&nbsp;набрать базу.
      </Rise>

      <SlideBody className="mt-6 gap-6">
        {/* Восходящая лестница */}
        <Rise delay={0.14}>
        <div className="flex h-[clamp(84px,12vh,150px)] items-end gap-3 sm:gap-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex h-full flex-1 flex-col justify-end">
              {s.pivot && (
                <span className="mb-1.5 hidden text-center font-mono text-[10px] uppercase tracking-[0.06em] text-volt sm:block">
                  переломный момент
                </span>
              )}
              <div
                style={{ height: `${s.pct}%`, animationDelay: `${0.2 + i * 0.1}s` }}
                className={`${styles.bar} w-full rounded-t-sm ${
                  s.tone === "peak" ? "bg-volt" : "bg-[var(--line-strong)]"
                }`}
              />
            </div>
          ))}
        </div>

        {/* подписи ступеней */}
        <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col">
              <span className={`font-mono tnum text-caption ${s.pivot ? "text-volt" : "text-mute"}`}>{s.n}</span>
              <span className={`mt-0.5 font-sans text-[13px] font-semibold leading-[1.1] sm:text-h3 ${s.pivot ? "text-volt" : ""}`}>
                {s.title}
              </span>
              <span className="mt-1.5 hidden font-sans text-[13px] leading-snug text-mute sm:block">
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </Rise>

        {/* Китай — переломный момент, с цифрами */}
        <Rise delay={0.12}>
          <div className="rounded-lg border border-volt/40 bg-[var(--bg-2)] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="flex items-center gap-2.5 font-sans text-h3 text-[var(--text)]">
              <span aria-hidden className="inline-block h-2 w-2 shrink-0 bg-volt" />
              Китай — рычаг маржи
            </h3>
            <span className="font-mono text-caption uppercase text-mute">
              OEM под своим брендом · цена клиенту та&nbsp;же
            </span>
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <Delta k="Себестоимость" from={<>110 000&nbsp;<R /></>} to={<>60–65 тыс.&nbsp;<R /></>} />
            <Delta k="Маржа с договора" from={<>120 000&nbsp;<R /></>} to={<>~160 000&nbsp;<R /></>} badge="+30–37%" accent />
            <Delta k="Цена выкупа клиенту" from={<>~210–231 тыс.</>} to={<>та же</>} note="зарабатываем кратно больше" />
          </div>
          </div>
        </Rise>
      </SlideBody>

      <Punch className="mt-8 max-w-[56ch]">
        Схему легко скопировать. Бренд с&nbsp;лучшей ценой и&nbsp;своим производством — нет.
        Именно это закрывает нишу навсегда.
      </Punch>
    </Slide>
  );
}

function Delta({
  k,
  from,
  to,
  badge,
  note,
  accent = false,
}: {
  k: ReactNode;
  from: ReactNode;
  to: ReactNode;
  badge?: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-caption uppercase text-mute">{k}</span>
      <div className="mt-1.5 flex items-baseline gap-2 font-mono tnum leading-none">
        <span className="text-[clamp(14px,1.6vw,17px)] text-mute line-through decoration-1 decoration-mute/40">{from}</span>
        <span className="text-mute">→</span>
        <span className={`text-[clamp(20px,2.6vw,32px)] ${accent ? "text-volt" : "text-[var(--text)]"}`}>{to}</span>
      </div>
      {badge && (
        <span className="mt-1.5 w-fit rounded-pill bg-volt px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
          {badge}
        </span>
      )}
      {note && (
        <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-mute">{note}</span>
      )}
    </div>
  );
}
