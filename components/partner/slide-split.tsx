"use client";

// СЛАЙД 6 — КУДА ИДУТ ДЕНЬГИ.
// Цель: честное правило распределения. ~40% выплат — возврат тела (каждый
// велик отбивает себя и покупает следующий), 60% — прибыль, делим по долям.
// Светлый слайд, наглядная полоса 40/60 + цикл удвоения парка.

import type { ReactNode } from "react";
import { Eyebrow, Punch, R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

export function SlideSplit({ index = "05" }: { index?: string } = {}) {
  return (
    <Slide id="split" theme="light">
      <Rise>
        <Eyebrow index={index}>Деньги</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[22ch] font-sans text-display-2">
        Правило простое: 40&nbsp;в&nbsp;рост, 60&nbsp;делим.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[56ch] font-sans text-body-lg text-mute">
        ~40% выплат — это возврат тела: каждый велик своими платежами отбивает
        себя и&nbsp;покупает следующий. Остальное — прибыль, делим по&nbsp;долям.
      </Rise>

      {/* Роли — партнёр заходит капиталом, операционку ведём мы. */}
      <Rise delay={0.13} className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-baseline gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3">
          <span className="shrink-0 font-mono text-caption uppercase text-[var(--acc)]">Партнёр</span>
          <span className="font-sans text-body leading-snug text-mute">
            капитал 2&nbsp;млн&nbsp;<R /> + отдельные моменты
          </span>
        </div>
        <div className="flex items-baseline gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3">
          <span className="shrink-0 font-mono text-caption uppercase text-mute">Мы</span>
          <span className="font-sans text-body leading-snug text-mute">
            закупки · сборка · продажи · аренда · сервис
          </span>
        </div>
      </Rise>

      <SlideBody className="mt-8 gap-6">
        {/* Полоса распределения 40/60 */}
        <Rise delay={0.12}>
          <div className="flex flex-col gap-1 font-mono text-caption uppercase sm:flex-row sm:items-baseline sm:justify-between">
            <span className="text-[var(--acc)]">~40% · возврат тела → новый велик</span>
            <span className="text-mute">60% · прибыль, делим по долям</span>
          </div>
          <div className="mt-2 flex h-12 w-full gap-1">
            <div className="flex w-[40%] items-center justify-center rounded-md bg-volt px-3">
              <span className="font-mono tnum text-h3 leading-none text-ink">40%</span>
            </div>
            <div className="flex flex-1 items-center justify-center rounded-md bg-[var(--line-strong)] px-3">
              <span className="font-mono tnum text-h3 leading-none text-[var(--text)]">60%</span>
            </div>
          </div>
        </Rise>

        {/* Две карточки-назначения */}
        <div className="grid gap-5 md:grid-cols-2">
          <Rise delay={0.16} className="h-full">
            <div className="flex h-full flex-col rounded-lg border border-acc bg-[var(--bg-2)] p-6">
              <span className="font-mono text-caption uppercase text-[var(--acc)]">~40% — возврат тела</span>
              <h3 className="mt-3 font-sans text-h3">Новый велик из выплат</h3>
              <p className="mt-3 font-sans text-body leading-snug text-mute">
                Каждый арендный велик за&nbsp;~4–5&nbsp;мес выплат отбивает своё тело —
                и&nbsp;сразу берём ещё один. Тело с&nbsp;продаж — так&nbsp;же в&nbsp;оборот.
              </p>
            </div>
          </Rise>
          <Rise delay={0.22} className="h-full">
            <div className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6">
              <span className="font-mono text-caption uppercase text-mute">60% — делим</span>
              <h3 className="mt-3 font-sans text-h3">Прибыль по долям</h3>
              <p className="mt-3 font-sans text-body leading-snug text-mute">
                Партнёр получает свою часть за&nbsp;капитал, не&nbsp;погружаясь
                в&nbsp;операционку. Прозрачно и&nbsp;регулярно.
              </p>
            </div>
          </Rise>
        </div>

        {/* Цикл роста — короткая цепочка */}
        <Rise delay={0.14} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--line)] pt-4 font-mono text-caption uppercase">
          <span className="text-mute">велик платит</span>
          <span aria-hidden className="text-mute">→</span>
          <span className="text-[var(--text)]">тело вернулось</span>
          <span aria-hidden className="text-mute">→</span>
          <span className="text-[var(--acc)]">новый велик&nbsp;↻</span>
        </Rise>
      </SlideBody>

      <Punch className="mt-6" marker="принцип">
        Часть — всегда обратно в&nbsp;дело. Так первый парк из&nbsp;15&nbsp;велосипедов
        превращается в&nbsp;30, потом в&nbsp;60.
      </Punch>
    </Slide>
  );
}
