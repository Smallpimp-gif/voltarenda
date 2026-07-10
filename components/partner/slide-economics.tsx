"use client";

// СЛАЙД 5 — ЭКОНОМИКА ПЕРВОГО ПАРКА.
// Цель: показать, откуда деньги — продажа 5 и аренда под выкуп 10.
// Тёмный слайд, прибыль светится volt'ом. Цифры из вводных партнёра.

import type { ReactNode } from "react";
import { Eyebrow, R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

export function SlideEconomics({ index = "04" }: { index?: string } = {}) {
  return (
    <Slide id="economics" theme="dark">
      <Rise>
        <Eyebrow index={index}>Экономика</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 font-sans text-display-2">
        Два источника денег.
      </Rise>

      <SlideBody className="mt-8 gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Продажа — быстрый плюс */}
          <Rise delay={0.1} className="h-full">
            <div className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5 sm:p-6">
              <span className="font-mono text-caption uppercase text-mute">5 велосипедов</span>
              <h3 className="mt-4 font-sans text-h3">Продажа</h3>
              <div className="mt-4 flex flex-col gap-1.5 font-mono text-caption uppercase text-mute">
                <FlowRow k="Плюс с велосипеда" v={<>15 000&nbsp;<R /></>} />
                <FlowRow k="5 велосипедов" v={<>+75 000&nbsp;<R /></>} />
                <FlowRow k="Тело велосипеда" v={<>в оборот магазина</>} />
              </div>
              <div className="mt-auto pt-6">
                <span className="font-mono text-caption uppercase text-mute">Маржа сразу</span>
                <div className="mt-1 font-mono tnum text-[clamp(28px,3.4vw,44px)] leading-none tracking-tight text-volt">
                  +75 000&nbsp;<R />
                </div>
              </div>
            </div>
          </Rise>

          {/* Аренда под выкуп — основной поток */}
          <Rise delay={0.16} className="h-full">
            <div className="flex h-full flex-col rounded-lg border border-volt/40 bg-[var(--bg-2)] p-5 sm:p-6">
              <span className="font-mono text-caption uppercase text-volt">10 велосипедов · основа</span>
              <h3 className="mt-4 font-sans text-h3">Аренда под выкуп</h3>
              <div className="mt-4 flex flex-col gap-1.5 font-mono text-caption uppercase text-mute">
                <FlowRow k="Первая неделя / велосипед" v={<>10 500&nbsp;<R /></>} />
                <FlowRow k="в т.ч. залог (касса)" v={<>5 000&nbsp;<R /></>} />
                <FlowRow k="Каждая следующая неделя" v={<>5 500&nbsp;<R /></>} />
              </div>
              <div className="mt-auto pt-6">
                <span className="font-mono text-caption uppercase text-mute">Поток с 10 велосипедов</span>
                <div className="mt-1 font-mono tnum text-[clamp(28px,3.4vw,44px)] leading-none tracking-tight text-volt">
                  55 000&nbsp;<R />/нед
                </div>
              </div>
            </div>
          </Rise>
        </div>

        {/* Первая неделя — сколько на руках суммарно */}
        <Rise delay={0.12}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-volt/40 bg-[var(--bg-2)] px-5 py-3.5 sm:px-6">
            <span className="shrink-0 font-mono text-caption uppercase text-volt">Первая неделя на руках</span>
            <Num value={<>105 000&nbsp;<R /></>} unit="10 × 10 500" />
            <Num value={<>55 000&nbsp;<R /></>} unit="выручка аренды" />
            <Num value={<>50 000&nbsp;<R /></>} unit="залоги · касса" />
            <span className="w-full font-mono text-caption uppercase text-mute sm:ml-auto sm:w-auto">
              + 75 000 <R /> с продажи 5
            </span>
          </div>
        </Rise>
      </SlideBody>

      <Rise delay={0.1} className="mt-6 border-t border-[var(--line)] pt-4">
        <p className="max-w-[68ch] font-mono text-caption uppercase leading-relaxed text-mute">
          Дальше поток стабильный: <span className="text-[var(--text)]">55 000&nbsp;<R />/нед</span> ≈{" "}
          <span className="text-[var(--text)]">~220 000&nbsp;<R />/мес</span> только с&nbsp;10&nbsp;арендных —
          до&nbsp;полного выкупа каждого.
        </p>
      </Rise>
    </Slide>
  );
}

function FlowRow({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-1.5 last:border-0">
      <span>{k}</span>
      <span className="tnum text-right text-[var(--text)]">{v}</span>
    </div>
  );
}

function Num({ value, unit }: { value: ReactNode; unit: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono tnum text-[clamp(20px,2.4vw,30px)] leading-none tracking-tight text-[var(--text)]">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-mute">{unit}</span>
    </div>
  );
}
