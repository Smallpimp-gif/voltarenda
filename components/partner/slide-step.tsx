"use client";

// СЛАЙД 2 — ПЕРВЫЙ ШАГ: НА ЧТО ИДУТ 2 МЛН.
// Цель: показать, что деньги — не в воздух, а в три понятных актива.
// Светлый слайд, спокойная сетка из трёх карточек-назначений.

import type { ReactNode } from "react";
import { Eyebrow, Punch, R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

const BUCKETS: { tag: string; title: string; items: ReactNode[]; accent?: boolean }[] = [
  {
    tag: "5 велосипедов",
    title: "На продажу",
    items: [
      <>Микс U2 / U2&nbsp;Pro / U7 — разные ценовые точки</>,
      <>С&nbsp;АКБ в&nbsp;комплекте, готовы к&nbsp;выдаче</>,
      <>Плюс <span className="font-semibold text-[var(--text)]">15&nbsp;000&nbsp;<R /></span> с&nbsp;каждого · тело в&nbsp;оборот</>,
    ],
  },
  {
    tag: "10 велосипедов",
    title: "В аренду под выкуп",
    accent: true,
    items: [
      <>U2&nbsp;Pro — рабочая модель курьера</>,
      <>10&nbsp;АКБ 60/33 в&nbsp;комплекте + 10&nbsp;АКБ 60/60 (~120&nbsp;км)</>,
      <>Недельный поток с&nbsp;первого дня</>,
    ],
  },
  {
    tag: "База",
    title: "Помещение + ремонт",
    items: [
      <>Аренда помещения, минимальный ремонт</>,
      <>Мастерская: сборка, ремонт, тюнинг</>,
      <>Хранение парка и&nbsp;точка доверия</>,
    ],
  },
];

export function SlideStep({ index = "01" }: { index?: string } = {}) {
  return (
    <Slide id="step" theme="light">
      <Rise>
        <Eyebrow index={index}>Первый шаг</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[24ch] font-sans text-display-2">
        2&nbsp;000&nbsp;000&nbsp;<R /> — и три актива на&nbsp;старте.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[54ch] font-sans text-body-lg text-mute">
        Деньги не&nbsp;лежат и&nbsp;не&nbsp;горят: 15&nbsp;велосипедов, банк&nbsp;АКБ и&nbsp;своё
        помещение. Каждый рубль — в&nbsp;актив, который работает.
      </Rise>

      <SlideBody className="mt-8">
        <div className="grid gap-5 md:grid-cols-3">
          {BUCKETS.map((b, i) => (
            <Rise key={b.title} delay={0.12 + i * 0.06} className="h-full">
              <div
                className={`flex h-full flex-col rounded-lg border p-6 ${
                  b.accent ? "border-acc bg-[var(--bg-2)]" : "border-[var(--line)] bg-[var(--bg-2)]"
                }`}
              >
                <span className={`font-mono text-caption uppercase ${b.accent ? "text-[var(--acc)]" : "text-mute"}`}>
                  {b.tag}
                </span>
                <h3 className="mt-3 font-sans text-h3">{b.title}</h3>
                <ul className="mt-5 flex flex-col gap-3 font-sans text-body text-mute">
                  {b.items.map((it, j) => (
                    <li key={j} className="flex items-baseline gap-3">
                      <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 bg-[var(--acc)]" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Rise>
          ))}
        </div>
      </SlideBody>

      <Punch className="mt-8" marker="фундамент">
        Помещение — не&nbsp;расход, а&nbsp;фундамент доверия. С&nbsp;него начинается всё
        остальное.
      </Punch>
    </Slide>
  );
}
