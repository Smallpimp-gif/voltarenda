"use client";

// ОБЪЕДИНЁННЫЙ ДЕК · СЛАЙД 4 — ДВА ПУТИ ЗАХОДА.
// Ключевой слайд объединённого дека: большой вход (10 млн) и тест (2 млн),
// оба ведут к одной доле — 20%. Светлый слайд.

import type { ReactNode } from "react";
import { Eyebrow, Punch, R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

const PATHS: {
  tag: string;
  title: string;
  sum: ReactNode;
  share: ReactNode;
  items: ReactNode[];
  accent?: boolean;
}[] = [
  {
    tag: "Путь A · Масштаб",
    title: "Заходишь сразу",
    sum: <>10 000 000&nbsp;<R /></>,
    share: <>20%</>,
    items: [
      <>Большой парк с&nbsp;первого шага</>,
      <>Максимальная скорость захвата</>,
      <>Полное видение — рынок, бренд, рост</>,
    ],
  },
  {
    tag: "Путь B · Тест",
    title: "Начинаешь с малого",
    sum: <>2 000 000&nbsp;<R /></>,
    share: <>~4%</>,
    accent: true,
    items: [
      <>15 великов, помещение, поток за&nbsp;~3&nbsp;недели</>,
      <>Минимальный риск — проверяешь на&nbsp;деле</>,
      <>Добираешь долю <span className="font-semibold text-[var(--text)]">до&nbsp;20%</span> по&nbsp;мере доверия</>,
    ],
  },
];

export function SlidePaths() {
  return (
    <Slide id="paths" theme="light">
      <Rise>
        <Eyebrow index="03">Два пути</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[22ch] font-sans text-display-2">
        Два пути захода. Одна доля — <span className="text-[var(--acc)]">20%</span>.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[56ch] font-sans text-body-lg text-mute">
        Заходишь большим шагом или начинаешь тестом. Оценка единая:{" "}
        <span className="text-[var(--text)]">10&nbsp;млн&nbsp;=&nbsp;20%</span>. Оба пути ведут
        к&nbsp;одной доле.
      </Rise>

      <SlideBody className="mt-8">
        <div className="grid gap-5 md:grid-cols-2">
          {PATHS.map((p, i) => (
            <Rise key={p.title} delay={0.12 + i * 0.08} className="h-full">
              <div
                className={`flex h-full flex-col rounded-lg border p-6 sm:p-7 ${
                  p.accent ? "border-volt/40 bg-[var(--bg-2)]" : "border-[var(--line)] bg-[var(--bg-2)]"
                }`}
              >
                <span className={`font-mono text-caption uppercase ${p.accent ? "text-[var(--acc)]" : "text-mute"}`}>
                  {p.tag}
                </span>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <span className="font-mono tnum text-[clamp(24px,3vw,38px)] leading-none tracking-tight text-[var(--text)]">
                    {p.sum}
                  </span>
                  <span className="flex items-baseline gap-1.5">
                    <span className="font-mono tnum text-[clamp(28px,3.4vw,46px)] leading-none tracking-tight text-[var(--acc)]">
                      {p.share}
                    </span>
                    <span className="font-mono text-caption uppercase text-mute">доля</span>
                  </span>
                </div>
                <h3 className="mt-4 font-sans text-h3">{p.title}</h3>
                <ul className="mt-4 flex flex-col gap-3 font-sans text-body text-mute">
                  {p.items.map((it, j) => (
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

        {/* Схождение к 20% */}
        <Rise delay={0.14} className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--line)] pt-4 font-mono text-caption uppercase">
          <span className="text-mute">10 млн сразу</span>
          <span aria-hidden className="text-mute">/</span>
          <span className="text-mute">2 млн → добор</span>
          <span aria-hidden className="text-mute">→</span>
          <span className="text-[var(--acc)]">одна доля 20%</span>
        </Rise>
      </SlideBody>

      <Punch className="mt-6" marker="выбор">
        Хочешь — сразу, хочешь — с&nbsp;теста. Дальше показываем, как работает вход
        с&nbsp;2&nbsp;млн — по&nbsp;шагам.
      </Punch>
    </Slide>
  );
}
