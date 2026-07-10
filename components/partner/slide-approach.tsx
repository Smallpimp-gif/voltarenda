"use client";

// СЛАЙД 7 — ПОДХОД: ГИБКАЯ СТРАТЕГИЯ.
// Цель: показать партнёру, что мы не идём одной протоптанной тропой —
// подстраиваемся под рынок, задаём свой стандарт качества, тестируем новое
// ради максимального профита. Тёмный слайд, три принципа.

import type { ReactNode } from "react";
import { Eyebrow, Punch, Rise, Slide, SlideBody } from "@/components/invest/primitives";

const PRINCIPLES: { tag: string; title: string; desc: ReactNode }[] = [
  {
    tag: "Гибко под рынок",
    title: "Подстраиваемся",
    desc: <>Не&nbsp;держимся за&nbsp;одну схему — идём туда, где спрос и&nbsp;маржа выше.</>,
  },
  {
    tag: "Свой стандарт",
    title: "Задаём планку",
    desc: <>Свой уровень качества, а&nbsp;не&nbsp;догоняем чужой. Это и&nbsp;есть бренд.</>,
  },
  {
    tag: "Тест и рост",
    title: "Пробуем новое",
    desc: <>Тестируем, меряем, оставляем то, что приносит больше. Так растёт профит.</>,
  },
];

export function SlideApproach({ index = "06" }: { index?: string } = {}) {
  return (
    <Slide id="approach" theme="dark">
      <Rise>
        <Eyebrow index={index}>Подход</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[24ch] font-sans text-display-2">
        Стратегия <span className="text-volt">гибкая</span> — не&nbsp;одна тропа.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[58ch] font-sans text-body-lg text-mute">
        Подстраиваемся под рынок, задаём свой стандарт качества и&nbsp;работаем
        с&nbsp;аудиторией так, чтобы взять максимальный профит — а&nbsp;не&nbsp;идём одной
        протоптанной тропой.
      </Rise>

      <SlideBody className="mt-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Rise key={p.title} delay={0.12 + i * 0.06} className="h-full">
              <div className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6">
                <span className="font-mono text-caption uppercase text-volt">{p.tag}</span>
                <h3 className="mt-3 font-sans text-h3">{p.title}</h3>
                <p className="mt-3 font-sans text-body leading-snug text-mute">{p.desc}</p>
              </div>
            </Rise>
          ))}
        </div>
      </SlideBody>

      <Punch className="mt-8" marker="принцип">
        Одна протоптанная тропа — это потолок. Мы ищем, где профит выше, — тестируем
        и&nbsp;идём туда, чтобы зарабатывать больше.
      </Punch>
    </Slide>
  );
}
