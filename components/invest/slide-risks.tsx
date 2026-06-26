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
        <Eyebrow index="04">Риск-менеджмент</Eyebrow>
      </Rise>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <Rise delay={0.05} as="h2" className="font-sans text-display-2">
          Риски? Закрыты.
        </Rise>
        <Rise delay={0.1} className="hidden md:block">
          <span className="font-mono text-caption uppercase text-mute">
            деньги вперёд · актив под контролем
          </span>
        </Rise>
      </div>

      <SlideBody className="mt-12">
        <div className="grid gap-8 sm:grid-cols-2">
          {RISKS.map((r, i) => (
          <Rise key={r.n} delay={0.1 + i * 0.07}>
            <div className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption uppercase text-mute">
                  Угроза / {r.n}
                </span>
                <span aria-hidden className="text-danger">
                  <CrossIcon />
                </span>
              </div>

              <h3 className="mt-4 font-sans text-h3 text-danger line-through decoration-danger/40 decoration-2">
                {r.threat}
              </h3>

              <div className="mt-5 flex items-start gap-3 border-t border-[var(--line)] pt-5">
                <span aria-hidden className="mt-0.5 shrink-0 text-[var(--acc)]">
                  <ShieldIcon />
                </span>
                <div>
                  <span className="font-mono text-caption uppercase text-[var(--acc)]">Ответ</span>
                  <p className="mt-1.5 font-sans text-body leading-snug text-mute">
                    {r.answer}
                  </p>
                </div>
              </div>
            </div>
          </Rise>
          ))}
        </div>
      </SlideBody>

      <Punch className="mt-12 max-w-[40ch]">
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
