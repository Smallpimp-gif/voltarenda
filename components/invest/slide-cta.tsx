"use client";

// СЛАЙД 8 — ЗАХОДИ СЕЙЧАС (условия + потенциал + срочность).
// Цель: конвертировать в действие. Тёмный слайд с volt-CTA — эхо
// футера сайта. Высокий потенциал — ТОЛЬКО как верхний сценарий.

import type { ReactNode } from "react";
import { CountUp, Eyebrow, R, Rise, Slide, SlideBody } from "./primitives";

// five — множитель капитала за 5 лет: сложный процент от ставки сценария
// (1.4^5 ≈ ×5, 1.75^5 ≈ ×16, 2.2^5 ≈ ×50) при реинвесте.
const SCENARIOS: {
  tier: string;
  to: number;
  suffix?: string;
  five: string;
  desc: ReactNode;
  tone: "base" | "rise" | "peak";
}[] = [
  { tier: "Гарантия", to: 40, five: "×5", desc: <>даже если просто продолжаем как есть</>, tone: "base" },
  { tier: "База", to: 75, five: "×16", desc: <>при полном развороте модели</>, tone: "rise" },
  { tier: "Апсайд", to: 120, suffix: "+", five: "×50+", desc: <>Китай, бренд&nbsp;№1 в&nbsp;СНГ, новые города</>, tone: "peak" },
];

export function SlideCta() {
  return (
    <Slide id="cta" theme="dark">
      <Rise>
        <Eyebrow index="08">Условия захода</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 font-sans text-display-1">
        Заходи сейчас<span className="text-volt">.</span>
      </Rise>

      <SlideBody className="mt-10">
        {/* Предложение крупно — отдельная строка с воздухом */}
        <Rise delay={0.1} className="flex flex-wrap items-baseline gap-x-6 gap-y-6 sm:gap-x-12">
        <Offer value={<>10 000 000&nbsp;<R /></>} label="привлекаем" big />
        <Offer value={<>30%</>} label="доля · 3 года" />
        <Offer value={<>2 200 000&nbsp;<R /></>} label="основатель вложил сам" />
      </Rise>

      {/* Гибкость формата сделки — снимает барьер «только доля». */}
      <Rise delay={0.14} as="p" className="mt-4 max-w-[72ch] font-mono text-caption uppercase leading-relaxed text-mute">
        Рассмотрим любой формат — <span className="text-[var(--text)]">доля, займ или смешанная схема</span>.
        Рискуем вместе: у&nbsp;основателя свои деньги в&nbsp;деле.
      </Rise>

      {/* 3 сценария доходности по нарастающей */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
        {SCENARIOS.map((s, i) => {
          const peak = s.tone === "peak";
          const rise = s.tone === "rise";
          return (
            <Rise key={s.tier} delay={0.12 + i * 0.08}>
              <div
                className={`flex h-full flex-col rounded-lg border p-6 sm:p-7 ${
                  peak
                    ? "border-volt bg-volt text-ink"
                    : rise
                    ? "border-volt/40 bg-[var(--bg-2)]"
                    : "border-[var(--line)] bg-[var(--bg-2)]"
                }`}
              >
                <span className={`font-mono text-caption uppercase ${peak ? "text-ink/70" : "text-mute"}`}>
                  {s.tier}
                </span>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className={`font-mono tnum text-[clamp(40px,5.4vw,68px)] leading-[0.85] tracking-tight ${peak ? "text-ink" : rise ? "text-volt" : "text-[var(--text)]"}`}>
                    ~<CountUp to={s.to} />{s.suffix}%
                  </span>
                  <span className={`font-mono text-caption uppercase ${peak ? "text-ink/70" : "text-mute"}`}>
                    годовых
                  </span>
                </div>
                <p className={`mt-3 flex-1 font-sans text-body leading-snug ${peak ? "text-ink/80" : "text-mute"}`}>
                  {s.desc}
                </p>
                <div className={`mt-4 flex items-baseline justify-between gap-3 border-t pt-3 ${peak ? "border-ink/20" : "border-[var(--line)]"}`}>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.06em] ${peak ? "text-ink/70" : "text-mute"}`}>
                    горизонт 5 лет
                  </span>
                  <span className={`font-mono tnum text-[clamp(20px,2vw,26px)] leading-none ${peak ? "text-ink" : rise ? "text-volt" : "text-[var(--text)]"}`}>
                    {s.five}
                  </span>
                </div>
              </div>
            </Rise>
          );
        })}
      </div>

      {/* Главный посыл + честная формулировка про потенциал */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <Rise>
          <p className="border-l-2 border-volt pl-5 font-sans text-h3 leading-[1.2]">
            Нижняя граница — около&nbsp;40% годовых. Это пол, а&nbsp;не потолок.
          </p>
        </Rise>
        <Rise delay={0.08} as="p" className="font-sans text-body leading-snug text-mute">
          Множители — сложный процент за&nbsp;5&nbsp;лет при реинвесте. Верхний
          сценарий — Китай и&nbsp;бренд&nbsp;№1 в&nbsp;СНГ: не&nbsp;гарантия, но реальный
          потенциал ниши, где мы заходим первыми.
        </Rise>
      </div>
      </SlideBody>

      {/* Срочность — финальная фраза, низ слайда */}
      <Rise delay={0.1} className="mt-8 border-t border-[var(--line)] pt-8 sm:mt-10">
        <p className="max-w-[60ch] font-sans text-h3 leading-[1.2]">
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
      <span className={`font-mono tnum leading-none tracking-tight ${big ? "text-[clamp(34px,4.6vw,64px)] text-volt" : "text-[clamp(22px,2.6vw,36px)] text-[var(--text)]"}`}>
        {value}
      </span>
      <span className="mt-2 font-mono text-caption uppercase text-mute">{label}</span>
    </div>
  );
}
