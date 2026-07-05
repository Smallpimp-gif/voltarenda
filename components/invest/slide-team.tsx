"use client";

// СЛАЙД 7 — КОМАНДА И СИСТЕМА (почему у нас получается).
// Цель: показать компетенции — продукт/бренд свои, софт свой (бот с
// оплатами), свой сервис-механик, отобранные поставщики и входящий спрос.
// Светлый «инженерный» слайд перед условиями захода: «кто делает» → «заходи».

import type { ReactNode } from "react";
import { Eyebrow, Punch, Rise, Slide, SlideBody } from "./primitives";

const PILLARS: { n: string; title: string; desc: ReactNode }[] = [
  {
    n: "01",
    title: "Продукт и бренд",
    desc: (
      <>Основатель — дизайнер с&nbsp;многолетним опытом, работал с&nbsp;Альфа-Банком.
      Бренд, сайт и&nbsp;приложение спроектированы в&nbsp;доме, а&nbsp;не на&nbsp;аутсорсе.</>
    ),
  },
  {
    n: "02",
    title: "Свой софт",
    desc: (
      <>Telegram-бот с&nbsp;регистрацией и&nbsp;оплатами, электронные договоры,
      личные кабинеты арендаторов — клиент подключается за&nbsp;минуты.</>
    ),
  },
  {
    n: "03",
    title: "Сервис и сборка",
    desc: (
      <>Свой механик: сборка, обслуживание и&nbsp;ремонт парка. Велосипеды
      не&nbsp;простаивают — платежи не&nbsp;останавливаются.</>
    ),
  },
  {
    n: "04",
    title: "Поставки и спрос",
    desc: (
      <>Отобраны лучшие поставщики. Заявки на&nbsp;аренду и&nbsp;выкуп приходят
      каждый день — входящий поток, а&nbsp;не холодные продажи.</>
    ),
  },
];

export function SlideTeam() {
  return (
    <Slide id="team" theme="light">
      <Rise>
        <Eyebrow index="07">Команда и система</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[22ch] font-sans text-display-2">
        Не только маркетинг. Система.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[58ch] font-sans text-body-lg text-mute">
        Это не идея на&nbsp;салфетке: продукт, софт, сервис и&nbsp;поставки делаем
        сами — инфраструктура построена и&nbsp;работает каждый день.
      </Rise>

      <SlideBody className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {PILLARS.map((p, i) => (
            <Rise key={p.n} delay={0.1 + i * 0.07}>
              <div className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6">
                <span className="font-mono tnum text-caption text-[var(--acc)]">{p.n}</span>
                <h3 className="mt-2.5 font-sans text-h3 leading-tight">{p.title}</h3>
                <p className="mt-2.5 font-sans text-body leading-relaxed text-mute">
                  {p.desc}
                </p>
              </div>
            </Rise>
          ))}
        </div>
      </SlideBody>

      <Punch className="mt-8 max-w-[56ch] sm:mt-10">
        Деньги инвестора идут в&nbsp;масштаб, а&nbsp;не в&nbsp;эксперименты — система
        уже построена и&nbsp;приносит выручку.
      </Punch>
    </Slide>
  );
}
