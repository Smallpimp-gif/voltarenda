"use client";

// СЛАЙД 6 — ЗАХОДИ СЕЙЧАС (условия + потенциал + срочность).
// Цель: конвертировать в действие. Тёмный слайд с volt-CTA — эхо
// футера сайта. Высокий потенциал — ТОЛЬКО как верхний сценарий.

import type { ReactNode } from "react";
import { CountUp, Eyebrow, R, Rise, Slide, SlideBody } from "./primitives";

const SCENARIOS: {
  tier: string;
  to: number;
  suffix?: string;
  desc: ReactNode;
  tone: "base" | "rise" | "peak";
}[] = [
  { tier: "Гарантия", to: 40, desc: <>даже если просто продолжаем как есть</>, tone: "base" },
  { tier: "База", to: 75, desc: <>при полном развороте модели</>, tone: "rise" },
  { tier: "Апсайд", to: 120, suffix: "+", desc: <>с Китаем, брендом и&nbsp;новыми городами</>, tone: "peak" },
];

export function SlideCta() {
  return (
    <Slide id="cta" theme="dark">
      <Rise>
        <Eyebrow index="06">Условия захода</Eyebrow>
      </Rise>
      <Rise delay={0.05} as="h2" className="mt-6 font-sans text-display-1">
        Заходи сейчас.
      </Rise>

      <SlideBody className="mt-10">
        {/* Предложение крупно — отдельная строка с воздухом */}
        <Rise delay={0.1} className="flex flex-wrap items-end gap-x-12 gap-y-5">
        <Offer value={<>10 000 000&nbsp;<R /></>} label="привлекаем" big />
        <Offer value={<>30%</>} label="доля · 3 года" />
        <Offer value={<>~2 000 000&nbsp;<R /></>} label="основатель вложил сам" />
      </Rise>

      <Rise delay={0.14} as="p" className="mt-4 font-mono text-caption uppercase text-mute">
        Рискуем вместе с&nbsp;тобой — у&nbsp;основателя свои деньги в&nbsp;деле.
      </Rise>

      {/* 3 сценария доходности по нарастающей */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {SCENARIOS.map((s, i) => {
          const peak = s.tone === "peak";
          const rise = s.tone === "rise";
          return (
            <Rise key={s.tier} delay={0.12 + i * 0.08}>
              <div
                className={`flex h-full flex-col rounded-lg border p-8 ${
                  peak
                    ? "border-volt bg-volt text-ink"
                    : rise
                    ? "border-volt/40 bg-[var(--bg-2)]"
                    : "border-[var(--line)] bg-[var(--bg-2)]"
                }`}
              >
                <span className={`font-mono text-caption uppercase ${peak ? "text-ink/60" : "text-mute"}`}>
                  {s.tier}
                </span>
                <div className="mt-3 flex items-baseline">
                  <span className={`font-mono tnum text-[clamp(40px,5.4vw,68px)] leading-[0.85] tracking-tight ${peak ? "text-ink" : rise ? "text-volt" : "text-[var(--text)]"}`}>
                    ~<CountUp to={s.to} />{s.suffix}%
                  </span>
                </div>
                <span className={`mt-1 font-mono text-caption uppercase ${peak ? "text-ink/60" : "text-mute"}`}>
                  годовых
                </span>
                <p className={`mt-3 font-sans text-body leading-snug ${peak ? "text-ink/80" : "text-mute"}`}>
                  {s.desc}
                </p>
              </div>
            </Rise>
          );
        })}
      </div>

      {/* Главный посыл + честная формулировка про потенциал */}
      <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <Rise>
          <p className="border-l-2 border-volt pl-5 font-sans text-h3 leading-[1.2]">
            Нижняя граница — около&nbsp;<span className="text-volt">40% годовых</span>. Это пол, а&nbsp;не потолок.
          </p>
        </Rise>
        <Rise delay={0.08} as="p" className="font-sans text-body leading-snug text-mute">
          При сильном маркетинге, своём производстве в&nbsp;Китае и&nbsp;удачном раскладе
          доходность может быть кратно выше базовой. Это верхний сценарий —
          не&nbsp;гарантия, но реальный потенциал ниши, где мы заходим первыми.
        </Rise>
      </div>
      </SlideBody>

      {/* Срочность — финальная фраза, низ слайда */}
      <Rise delay={0.1} className="mt-12 border-t border-[var(--line)] pt-8">
        <p className="max-w-[60ch] font-sans text-h3 leading-[1.25]">
          Окно открыто сейчас. Через год ниша будет занята.{" "}
          <span className="text-volt">Заходи, пока место свободно.</span>
        </p>
      </Rise>
    </Slide>
  );
}

function Offer({ value, label, big = false }: { value: ReactNode; label: ReactNode; big?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={`font-mono tnum leading-none tracking-tight ${big ? "text-[clamp(28px,4vw,52px)] text-volt" : "text-[clamp(24px,3vw,40px)] text-[var(--text)]"}`}>
        {value}
      </span>
      <span className="mt-2 font-mono text-caption uppercase text-mute">{label}</span>
    </div>
  );
}
