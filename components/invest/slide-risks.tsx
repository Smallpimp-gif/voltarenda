"use client";

// СЛАЙД 4 — ПОЧЕМУ ЭТО НЕ РАЗВАЛИТСЯ.
// Цель: снять страх инвестора. 4 карточки «угроза → ответ».
// Светлый слайд — спокойно, по-инженерному, под контролем.

import type { ReactNode } from "react";
import { Eyebrow, Punch, Rise, Slide, SlideBody } from "./primitives";

const RISKS: { n: string; threat: string; answer: ReactNode }[] = [
  {
    n: "01",
    threat: "Неплатёж",
    answer: (
      <>Деньги <b className="font-semibold text-[var(--text)]">вперёд</b>: первый платёж + залог. Не&nbsp;платит — велосипед забираем. Курьер привязан к&nbsp;даркстору.</>
    ),
  },
  {
    n: "02",
    threat: "Поломка",
    answer: (
      <>Гарантия поставщика + свой сервис. Клиент <b className="font-semibold text-[var(--text)]">не&nbsp;выпадает</b> из&nbsp;платежей.</>
    ),
  },
  {
    n: "03",
    threat: "Кража",
    answer: (
      <><b className="font-semibold text-[var(--text)]">GPS</b> на каждом велосипеде + договор материальной ответственности.</>
    ),
  },
  {
    n: "04",
    threat: "Качество",
    answer: (
      <>Проверенные поставщики без брака. Дальше — <b className="font-semibold text-[var(--text)]">свой контроль качества</b> из&nbsp;Китая.</>
    ),
  },
];

export function SlideRisks() {
  return (
    <Slide id="risks" theme="light">
      <Rise>
        <Eyebrow index="05">Риск-менеджмент</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 font-sans text-display-2">
        Риски? Закрыты.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[58ch] font-sans text-body-lg text-mute">
        Четыре главных страха инвестора — и почему каждый закрыт структурно, а&nbsp;не на&nbsp;словах.
      </Rise>

      <SlideBody className="mt-8 sm:mt-12">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
          {RISKS.map((r, i) => (
          <Rise key={r.n} delay={0.1 + i * 0.07}>
            <div className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption uppercase text-mute">
                  Угроза / {r.n}
                </span>
                <span aria-hidden className="text-mute/70">
                  <CrossIcon />
                </span>
              </div>

              <h3 className="mt-4 font-sans text-h3 text-[var(--text)]">
                {r.threat}
              </h3>

              <div className="mt-auto flex items-start gap-3 border-t border-[var(--line)] pt-5">
                <span aria-hidden className="mt-0.5 shrink-0 text-[var(--acc)]">
                  <ShieldIcon />
                </span>
                <div>
                  <span className="font-mono text-caption uppercase text-[var(--acc)]">Ответ</span>
                  <p className="mt-1.5 font-sans text-body leading-relaxed text-[var(--text)]/80">
                    {r.answer}
                  </p>
                </div>
              </div>
            </div>
          </Rise>
          ))}
        </div>
      </SlideBody>

      <Punch className="mt-8 max-w-[40ch] sm:mt-12">
        Деньги — вперёд, актив — под контролем. Дефолтов почти нет.
      </Punch>
    </Slide>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-5 w-5",
};

function CrossIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps} className="h-5 w-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
