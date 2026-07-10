"use client";

// СЛАЙД 7 — УСЛОВИЯ ЗАХОДА.
// Цель: показать гибкий вход — тест малым, добор по мере доверия,
// довыкуп доли до 30% по повышенной оценке. Тёмный слайд, доли светятся
// volt'ом. Базис оценки из инвест-дека: 10 млн = 30% (1 млн ≈ 3%).

import type { ReactNode } from "react";
import { Eyebrow, Punch, R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

const TIERS: {
  tag: string;
  when: string;
  share: ReactNode;
  sum: ReactNode | null;
  note: ReactNode;
  tone: "base" | "rise" | "peak";
}[] = [
  {
    tag: "Тест",
    when: "сейчас",
    share: <>6%</>,
    sum: <>2 000 000&nbsp;<R /></>,
    note: <>по оферной оценке — 10&nbsp;млн&nbsp;=&nbsp;30%</>,
    tone: "base",
  },
  {
    tag: "Докуп",
    when: "после теста",
    share: <>21%</>,
    sum: <>6 000 000&nbsp;<R /></>,
    note: <>цена докупа доли</>,
    tone: "rise",
  },
  {
    tag: "Довыкуп",
    when: "опция",
    share: <>до&nbsp;30%</>,
    sum: null,
    note: <>по повышенной оценке · чуть дороже</>,
    tone: "peak",
  },
];

export function SlideTerms() {
  return (
    <Slide id="terms" theme="dark">
      <Rise>
        <Eyebrow index="08">Условия захода</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[22ch] font-sans text-display-2">
        Заходишь тестом. Долю добираешь.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[56ch] font-sans text-body-lg text-mute">
        Не&nbsp;нужно заходить сразу на&nbsp;всю сумму. Вложи 2&nbsp;млн в&nbsp;тест,
        убедись&nbsp;— и&nbsp;расти по&nbsp;мере доверия, вплоть до&nbsp;30% доли.
      </Rise>

      <SlideBody className="mt-8">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {TIERS.map((t, i) => {
            const peak = t.tone === "peak";
            const rise = t.tone === "rise";
            return (
              <Rise key={t.tag} delay={0.12 + i * 0.08}>
                <div
                  className={`flex h-full flex-col rounded-lg border p-6 sm:p-7 ${
                    peak
                      ? "border-volt bg-volt text-ink"
                      : rise
                      ? "border-volt/40 bg-[var(--bg-2)]"
                      : "border-[var(--line)] bg-[var(--bg-2)]"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`font-mono text-caption uppercase ${peak ? "text-ink/70" : rise ? "text-volt" : "text-mute"}`}>
                      {t.tag}
                    </span>
                    <span className={`font-mono text-[10px] uppercase tracking-[0.06em] ${peak ? "text-ink/70" : "text-mute"}`}>
                      {t.when}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className={`font-mono tnum text-[clamp(38px,5vw,64px)] leading-[0.85] tracking-tight ${peak ? "text-ink" : rise ? "text-volt" : "text-[var(--text)]"}`}>
                      {t.share}
                    </span>
                    <span className={`font-mono text-caption uppercase ${peak ? "text-ink/70" : "text-mute"}`}>
                      доля
                    </span>
                  </div>

                  {t.sum && (
                    <div className={`mt-3 font-mono tnum text-h3 ${peak ? "text-ink" : "text-[var(--text)]"}`}>
                      {t.sum}
                    </div>
                  )}

                  <p className={`mt-auto pt-5 font-mono text-caption uppercase leading-relaxed ${peak ? "text-ink/70" : "text-mute"}`}>
                    {t.note}
                  </p>
                </div>
              </Rise>
            );
          })}
        </div>
      </SlideBody>

      <Punch className="mt-8" marker="гибкость">
        Малый вход — меньше риска на&nbsp;старте. Долю доводишь до&nbsp;30%, как
        в&nbsp;оффере; после теста бизнес доказан и&nbsp;оценка выше — потому довыкуп
        чуть дороже.
      </Punch>
    </Slide>
  );
}
