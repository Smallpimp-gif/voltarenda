"use client";

// ОБЪЕДИНЁННЫЙ ДЕК · СЛАЙД 10 — УСЛОВИЯ ЗАХОДА.
// Гибкие условия при доле 20%: тест 2 млн → добор → довыкуп до 20%.
// Форматы сделки любые. Главный посыл — всё обсуждаемо. Тёмный слайд.
// Базис: 10 млн = 20% (1 млн = 2%).

import type { ReactNode } from "react";
import { Eyebrow, Punch, R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

const TIERS: { tag: string; when: string; share: ReactNode; sum: ReactNode | null; note: ReactNode; tone: "base" | "rise" | "peak" }[] = [
  { tag: "Тест", when: "сейчас", share: <>~4%</>, sum: <>2 000 000&nbsp;<R /></>, note: <>10&nbsp;млн&nbsp;=&nbsp;20%</>, tone: "base" },
  { tag: "Добор", when: "после теста", share: <>~14%</>, sum: <>+5 000 000&nbsp;<R /></>, note: <>7&nbsp;млн всего</>, tone: "rise" },
  { tag: "Довыкуп", when: "опция", share: <>до&nbsp;20%</>, sum: null, note: <>по повышенной оценке · чуть дороже</>, tone: "peak" },
];

const FORMATS = ["Доля", "Займ", "Смешанная схема"];

export function SlideTerms() {
  return (
    <Slide id="terms" theme="dark">
      <Rise>
        <Eyebrow index="11">Условия захода</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[22ch] font-sans text-display-2">
        Условия гибкие. <span className="text-volt">Всё обсуждаемо.</span>
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[58ch] font-sans text-body-lg text-mute">
        Доля 20%. Заходишь на&nbsp;10&nbsp;млн сразу или тестом с&nbsp;2&nbsp;млн
        и&nbsp;добираешь. Ниже — как растёт доля на&nbsp;тестовом пути.
      </Rise>

      <SlideBody className="mt-8 gap-6">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {TIERS.map((t, i) => {
            const peak = t.tone === "peak";
            const rise = t.tone === "rise";
            return (
              <Rise key={t.tag} delay={0.12 + i * 0.08}>
                <div className={`flex h-full flex-col rounded-lg border p-6 ${peak ? "border-volt bg-volt text-ink" : rise ? "border-volt/40 bg-[var(--bg-2)]" : "border-[var(--line)] bg-[var(--bg-2)]"}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`font-mono text-caption uppercase ${peak ? "text-ink/70" : rise ? "text-volt" : "text-mute"}`}>{t.tag}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-[0.06em] ${peak ? "text-ink/70" : "text-mute"}`}>{t.when}</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className={`font-mono tnum text-[clamp(34px,4.4vw,58px)] leading-[0.85] tracking-tight ${peak ? "text-ink" : rise ? "text-volt" : "text-[var(--text)]"}`}>{t.share}</span>
                    <span className={`font-mono text-caption uppercase ${peak ? "text-ink/70" : "text-mute"}`}>доля</span>
                  </div>
                  {t.sum && <div className={`mt-3 font-mono tnum text-h3 ${peak ? "text-ink" : "text-[var(--text)]"}`}>{t.sum}</div>}
                  <p className={`mt-auto pt-5 font-mono text-caption uppercase leading-relaxed ${peak ? "text-ink/70" : "text-mute"}`}>{t.note}</p>
                </div>
              </Rise>
            );
          })}
        </div>

        {/* Форматы сделки */}
        <Rise delay={0.14} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[var(--line)] pt-4">
          <span className="font-mono text-caption uppercase text-mute">Формат сделки</span>
          {FORMATS.map((f) => (
            <span key={f} className="rounded-pill border border-[var(--line)] bg-[var(--bg-2)] px-4 py-1.5 font-mono text-caption uppercase text-[var(--text)]">
              {f}
            </span>
          ))}
          <span className="font-mono text-caption uppercase text-mute">— как удобно</span>
        </Rise>
      </SlideBody>

      <Punch className="mt-6" marker="открыты">
        Цифры и&nbsp;формат — не&nbsp;ультиматум, а&nbsp;отправная точка. Всё обсуждаемо,
        <span className="text-volt"> открыты к&nbsp;предложениям</span> — подстроимся под тебя.
      </Punch>
    </Slide>
  );
}
