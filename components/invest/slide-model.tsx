"use client";

// СЛАЙД 3 — КАК МЫ ДЕЛАЕМ ДЕНЬГИ.
// Цель: простая прибыльная экономика + инфраструктура и связи.
// Тёмный слайд — прибыль/цифры светятся volt'ом. Цифры из финмодели.

import type { ReactNode } from "react";
import { Eyebrow, R, Rise, Slide, SlideBody } from "./primitives";

export function SlideModel() {
  return (
    <Slide id="model" theme="dark">
      <Rise>
        <Eyebrow index="03">Юнит-экономика</Eyebrow>
      </Rise>
      <Rise delay={0.05} as="h2" className="mt-6 font-sans text-display-2">
        Простая модель. Быстрые деньги.
      </Rise>

      <SlideBody className="mt-6 gap-6">
        {/* Две модели */}
        <div className="grid items-start gap-6 md:grid-cols-2">
        {/* Выкуп — основа, accent */}
        <Rise delay={0.1}>
          <div className="flex flex-col rounded-lg border border-volt/40 bg-[var(--bg-2)] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-caption uppercase text-mute">Основа</span>
              <span className="rounded-pill bg-volt px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
                выкуп в рассрочку
              </span>
            </div>
            <h3 className="mt-4 font-sans text-h3">Выкуп в рассрочку</h3>

            {/* мини-поток */}
            <div className="mt-4 flex flex-col gap-1.5 font-mono text-caption uppercase text-mute">
              <FlowRow k="Велосипед" v={<>~110&nbsp;000&nbsp;<R /></>} />
              <FlowRow k="Платёж клиента" v={<>5 000–5 500&nbsp;<R />/нед</>} />
              <FlowRow k="Выкуп за ~10 мес" v={<>~210–231&nbsp;тыс.&nbsp;<R /></>} />
            </div>

            <div className="mt-6">
              <span className="font-mono text-caption uppercase text-mute">Маржа с договора</span>
              <div className="mt-1 font-mono tnum text-[clamp(30px,4vw,50px)] leading-none tracking-tight text-volt">
                ~120 000&nbsp;<R />
              </div>
            </div>
          </div>
        </Rise>

        {/* Аренда — вторичная */}
        <Rise delay={0.16}>
          <div className="flex flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5 sm:p-6">
            <span className="font-mono text-caption uppercase text-mute">Альтернатива</span>
            <h3 className="mt-4 font-sans text-h3">Аренда</h3>
            <ul className="mt-5 flex flex-col gap-3 font-sans text-body text-mute">
              <Bullet>Велосипед остаётся наш</Bullet>
              <Bullet>Стабильный недельный поток</Bullet>
              <Bullet>Актив на балансе компании</Bullet>
            </ul>
            <p className="mt-5 font-mono text-caption uppercase leading-relaxed text-mute">
              Покупаем велосипеды под реального арендатора — капитал не&nbsp;простаивает.
            </p>
          </div>
        </Rise>
      </div>

        {/* Цикл реинвеста — как капитал оборачивается и наращивает парк */}
        <Rise delay={0.1}>
          <ReinvestCycle />
        </Rise>
      </SlideBody>

      {/* Наши преимущества — низ слайда */}
      <div className="mt-6 grid gap-8 sm:grid-cols-3">
        <Adv
          delay={0.1}
          icon={<NetworkIcon />}
          title="Связи и каналы"
          desc={<>Прямой выход через директоров складов. Самокат переводит всех курьеров на электровелосипеды — наша аренда у&nbsp;них первая.</>}
        />
        <Adv
          delay={0.16}
          icon={<TagIcon />}
          title="Лучшая цена на рынке"
          desc={<>5 000 против 6 500–7 500&nbsp;<R /> у&nbsp;конкурентов. Заходим ценой.</>}
        />
        <Adv
          delay={0.22}
          icon={<StackIcon />}
          title="Готовая инфраструктура"
          desc={<>Бренд, сайт, электронные договоры — подключение клиента быстрое и&nbsp;масштабируемое.</>}
        />
      </div>
    </Slide>
  );
}

// Цикл реинвеста — честный механизм: тело велосипеда возвращается за ~4–5 мес,
// сразу уходит в новый велосипед (парк растёт), а старый ещё ~5 мес платит
// чистую прибыль. Показываем МЕХАНИЗМ (быстрый оборот), не обещая % доходности —
// итоговая доходность инвестора заявлена сценариями на слайде 6.
function ReinvestCycle() {
  return (
    <div className="rounded-lg border border-volt/40 bg-[var(--bg-2)] p-5 sm:p-6">
      {/* заголовок блока */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-sans text-h3">Как капитал множится</h3>
        <span className="font-mono text-caption uppercase text-mute">
          деньги в&nbsp;обороте — не&nbsp;лежат
        </span>
      </div>

      {/* верхние метки сумм: вложили → вернул вдвое */}
      <div className="mt-5 flex items-baseline justify-between font-mono text-caption uppercase">
        <span className="text-mute">
          вложили <span className="tnum text-[var(--text)]">110к&nbsp;<R /></span>
        </span>
        <span className="text-mute">
          вернул <span className="tnum text-volt">~220к&nbsp;<R /></span> · 2×
        </span>
      </div>

      {/* двухсегментная полоса-таймлайн: время вшито в подписи сегментов */}
      <div className="mt-2 flex h-10 w-full gap-1">
        <div className="flex w-[46%] items-center justify-center rounded-md bg-[var(--line-strong)] px-3">
          <span className="text-center font-mono text-[10px] uppercase leading-tight tracking-[0.04em] text-[var(--text)]">
            возврат тела · ~4–5&nbsp;мес
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-md bg-volt px-3">
          <span className="text-center font-mono text-[10px] uppercase leading-tight tracking-[0.04em] text-ink">
            чистая прибыль · ещё&nbsp;~5&nbsp;мес
          </span>
        </div>
      </div>

      {/* цепочка реинвеста: тело вернулось → новый велосипед → парк растёт */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--line)] pt-4 font-mono text-caption uppercase">
        <span className="text-mute">тело вернулось</span>
        <Arrow />
        <span className="text-[var(--text)]">купили велосипед №2</span>
        <Arrow />
        <span className="text-volt">парк растёт&nbsp;↻</span>
        <span className="ml-auto font-sans text-[13px] normal-case tracking-normal text-mute">
          а&nbsp;старый ещё ~5&nbsp;мес платит прибыль
        </span>
      </div>

      {/* честная подпись-защита: рост под спрос, доходность — в сценариях */}
      <p className="mt-2 max-w-[82ch] font-sans text-[13px] leading-snug text-mute">
        Парк растёт под реальный спрос — велосипед покупаем под арендатора.
        Итоговая доходность инвестора — в&nbsp;сценариях далее.
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="text-mute">
      →
    </span>
  );
}

function FlowRow({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-1.5 last:border-0">
      <span>{k}</span>
      <span className="tnum text-right text-[var(--text)]">{v}</span>
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-3">
      <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 bg-volt" />
      <span>{children}</span>
    </li>
  );
}

function Adv({
  icon,
  title,
  desc,
  delay = 0,
}: {
  icon: ReactNode;
  title: string;
  desc: ReactNode;
  delay?: number;
}) {
  return (
    <Rise delay={delay}>
      <div className="flex flex-col">
        <span className="flex h-7 w-7 items-center justify-center text-volt">{icon}</span>
        <h3 className="mt-2.5 font-sans text-[clamp(17px,1.9vw,22px)] font-semibold leading-tight">{title}</h3>
        <p className="mt-1.5 font-sans text-[13px] leading-snug text-mute">{desc}</p>
      </div>
    </Rise>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-6 w-6",
};

function NetworkIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 7.5 6.5 17M12 7.5 17.5 17M7.5 19h9" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 7v5.3a2 2 0 0 0 .6 1.4l7 7a2 2 0 0 0 2.8 0l5.3-5.3a2 2 0 0 0 0-2.8l-7-7A2 2 0 0 0 12.3 5H7a4 4 0 0 0-4 4Z" />
      <circle cx="8" cy="9" r="1.3" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg {...iconProps}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}
