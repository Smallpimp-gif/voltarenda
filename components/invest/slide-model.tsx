"use client";

// СЛАЙД 4 — КАК МЫ ДЕЛАЕМ ДЕНЬГИ.
// Цель: простая прибыльная экономика + инфраструктура и связи.
// Тёмный слайд — прибыль/цифры светятся volt'ом. Цифры из финмодели.

import type { ReactNode } from "react";
import { Eyebrow, R, Rise, Slide, SlideBody } from "./primitives";

export function SlideModel() {
  return (
    <Slide id="model" theme="dark">
      <Rise>
        <Eyebrow index="04">Юнит-экономика</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 font-sans text-display-2">
        Простая модель. Быстрые деньги.
      </Rise>

      {/* Живая тяга — это не теория: вот текущая выручка. Числа нейтральные,
          единственный крупный volt-акцент слайда — маржа ниже. */}
      <Rise delay={0.08} className="mt-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-volt/40 bg-[var(--bg-2)] px-5 py-3.5 sm:px-6">
          <span className="shrink-0 font-mono text-caption uppercase text-volt">Уже работает</span>
          <TractionNum value="21" unit="велосипед сдан" />
          <TractionNum value={<>119 750&nbsp;<R /></>} unit="в неделю" />
          <TractionNum value={<>~520 000&nbsp;<R /></>} unit="в месяц" />
          <span className="w-full font-mono text-caption uppercase text-mute sm:ml-auto sm:w-auto">деньги вперёд · залог</span>
        </div>
      </Rise>

      <SlideBody className="mt-5 gap-5">
        {/* Две модели — симметричные шапки, равная высота */}
        <div className="grid gap-6 md:grid-cols-2">
        {/* Выкуп — основа, accent */}
        <Rise delay={0.1} className="h-full">
          <div className="flex h-full flex-col rounded-lg border border-volt/40 bg-[var(--bg-2)] p-5">
            <span className="font-mono text-caption uppercase text-volt">Основа</span>
            <h3 className="mt-4 font-sans text-h3">Выкуп в рассрочку</h3>

            {/* мини-поток */}
            <div className="mt-4 flex flex-col gap-1.5 font-mono text-caption uppercase text-mute">
              <FlowRow k="Велосипед" v={<>~110&nbsp;000&nbsp;<R /></>} />
              <FlowRow k="Платёж клиента" v={<>5 500&nbsp;<R />/нед</>} />
              <FlowRow k="Выкуп за ~10 мес" v={<>~220–231&nbsp;тыс.&nbsp;<R /></>} />
            </div>

            <div className="mt-auto pt-6">
              <span className="font-mono text-caption uppercase text-mute">Маржа с договора</span>
              <div className="mt-1 font-mono tnum text-[clamp(28px,3.4vw,44px)] leading-none tracking-tight text-volt">
                ~120 000&nbsp;<R />
              </div>
            </div>
          </div>
        </Rise>

        {/* Аренда — вторичная */}
        <Rise delay={0.16} className="h-full">
          <div className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
            <span className="font-mono text-caption uppercase text-mute">Альтернатива</span>
            <h3 className="mt-4 font-sans text-h3">Аренда</h3>
            <ul className="mt-5 flex flex-col gap-3 font-sans text-body text-mute">
              <Bullet>Велосипед остаётся наш</Bullet>
              <Bullet>Стабильный недельный поток</Bullet>
              <Bullet>Актив на балансе компании</Bullet>
            </ul>
            <p className="mt-auto pt-5 font-mono text-caption uppercase leading-relaxed text-mute">
              Покупаем велосипеды под реального арендатора — капитал не&nbsp;простаивает.
            </p>
          </div>
        </Rise>
      </div>

        {/* Цикл реинвеста — как капитал оборачивается и наращивает парк */}
        <Rise delay={0.1}>
          <ReinvestCycle />
        </Rise>
      </SlideBody>

      {/* Преимущества — компактной строкой (подробнее на слайдах рынка/клиентов) */}
      <Rise
        delay={0.1}
        className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-[var(--line)] pt-4 font-mono text-caption uppercase leading-relaxed text-mute [@media(min-width:768px)_and_(max-height:979px)]:hidden"
      >
        <span>
          <span className="font-semibold text-[var(--text)]">Связи</span>&nbsp;— директора складов, Самокат первым
        </span>
        <span>
          <span className="font-semibold text-[var(--text)]">Лучшая цена</span>&nbsp;— 5&nbsp;500&nbsp;<R /> против 6&nbsp;500–7&nbsp;500
        </span>
        <span>
          <span className="font-semibold text-[var(--text)]">Инфраструктура</span>&nbsp;— бренд, сайт, e-договоры
        </span>
      </Rise>
    </Slide>
  );
}

// Цикл реинвеста — честный механизм: тело велосипеда возвращается за ~4–5 мес,
// сразу уходит в новый велосипед (парк растёт), а старый ещё ~5 мес платит
// чистую прибыль. Показываем МЕХАНИЗМ (быстрый оборот), не обещая % доходности —
// итоговая доходность инвестора заявлена сценариями на слайде 6.
function ReinvestCycle() {
  return (
    <div className="rounded-lg border border-volt/40 bg-[var(--bg-2)] p-5">
      {/* заголовок блока */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-sans text-h3">Как капитал множится</h3>
        <span className="font-mono text-caption uppercase text-mute">
          деньги в&nbsp;обороте — не&nbsp;лежат
        </span>
      </div>

      {/* верхние метки сумм: вложили → вернул вдвое */}
      <div className="mt-4 flex flex-col gap-1 font-mono text-caption uppercase sm:flex-row sm:items-baseline sm:justify-between">
        <span className="text-mute">
          вложили <span className="tnum text-[var(--text)]">110 000&nbsp;<R /></span>
        </span>
        <span className="text-mute">
          вернул <span className="tnum text-volt">~220 000&nbsp;<R /></span> · 2×
        </span>
      </div>

      {/* двухсегментная полоса-таймлайн: время вшито в подписи сегментов */}
      <div className="mt-2 flex h-11 w-full gap-1 sm:h-10">
        <div className="flex w-[46%] items-center justify-center rounded-md bg-[var(--line-strong)] px-2 sm:px-3">
          <span className="text-center font-mono text-[10px] uppercase leading-[1.15] tracking-[0.04em] text-[var(--text)]">
            возврат тела · ~4–5&nbsp;мес
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-md bg-volt px-2 sm:px-3">
          <span className="text-center font-mono text-[10px] uppercase leading-[1.15] tracking-[0.04em] text-ink">
            чистая прибыль · ещё&nbsp;~5&nbsp;мес
          </span>
        </div>
      </div>

      {/* цепочка реинвеста: тело вернулось → новый велосипед → парк растёт */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--line)] pt-4 font-mono text-caption uppercase">
        <span className="text-mute">тело вернулось</span>
        <Arrow />
        <span className="text-[var(--text)]">купили велосипед №2</span>
        <Arrow />
        <span className="text-volt">парк растёт&nbsp;↻</span>
      </div>

      {/* честная подпись-защита: рост под спрос, доходность — в сценариях */}
      <p className="mt-3 max-w-[56ch] font-sans text-[13px] leading-snug text-mute">
        Парк растёт под реальный спрос — велосипед покупаем под арендатора.
        Итоговая доходность инвестора — в&nbsp;сценариях далее.
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="text-mute">
      →
    </span>
  );
}

function TractionNum({
  value,
  unit,
  accent = false,
}: {
  value: ReactNode;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`font-mono tnum text-[clamp(20px,2.4vw,30px)] leading-none tracking-tight ${
          accent ? "text-volt" : "text-[var(--text)]"
        }`}
      >
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-mute">{unit}</span>
    </div>
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

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-3">
      <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 bg-volt" />
      <span>{children}</span>
    </li>
  );
}

