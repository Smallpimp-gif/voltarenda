"use client";

// ОБЪЕДИНЁННЫЙ ДЕК · СЛАЙД 11 — ЗАХОДИ СЕЙЧАС.
// Финал: рекап оффера (два пути, 20%, всё обсуждаемо) + срочность.

import type { ReactNode } from "react";
import { R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

export function SlideCta() {
  return (
    <Slide id="cta" theme="dark">
      <Rise>
        <span className="flex items-center gap-3 font-mono text-caption uppercase text-mute">
          <span aria-hidden className="inline-block h-1.5 w-1.5 shrink-0 bg-volt" />
          <span className="text-[var(--text)]">11</span>
          <span>Заход</span>
        </span>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 font-sans text-display-1">
        Заходи сейчас<span className="text-volt">.</span>
      </Rise>
      <Rise delay={0.12} as="p" className="mt-5 max-w-[52ch] font-sans text-body-lg text-mute">
        Окно открыто. Через год нишу займут. Заходи большим шагом или тестом —
        решаем вместе.
      </Rise>

      <SlideBody className="mt-10">
        <Rise delay={0.1} className="flex flex-wrap items-baseline gap-x-8 gap-y-6 sm:gap-x-12">
          <Offer value={<>10&nbsp;млн / 2&nbsp;млн</>} label="сразу или тестом" big />
          <Offer value={<>20%</>} label="доля" />
          <Offer value={<>2 300 000&nbsp;<R /></>} label="основатель вложил сам" />
        </Rise>

        <Rise delay={0.16} className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <p className="border-l-2 border-volt pl-5 font-sans text-h3 leading-[1.2]">
            Формат любой — доля, займ или смешанная схема. Рискуем вместе:
            у&nbsp;основателя свои деньги в&nbsp;деле.
          </p>
          <p className="font-sans text-body leading-snug text-mute">
            Всё обсуждаемо — цифры и&nbsp;условия это отправная точка. Начни хоть
            с&nbsp;теста на&nbsp;2&nbsp;млн: помещение, парк и&nbsp;поток — за&nbsp;~3&nbsp;недели.
          </p>
        </Rise>
      </SlideBody>

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
      <span className={`font-mono tnum leading-none tracking-tight ${big ? "text-[clamp(30px,4vw,56px)] text-volt" : "text-[clamp(22px,2.6vw,36px)] text-[var(--text)]"}`}>
        {value}
      </span>
      <span className="mt-2 font-mono text-caption uppercase text-mute">{label}</span>
    </div>
  );
}
