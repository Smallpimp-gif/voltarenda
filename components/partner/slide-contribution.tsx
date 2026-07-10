"use client";

// СЛАЙД — НАШ ВКЛАД.
// Помимо 2,3 млн деньгами основателя, уже сделана инфраструктура (~720к по
// рынку) — её можно учесть в стоимости. Дальше ведение всего + соцсети на нас,
// пока нет сотрудников. Тёмный слайд. index — проп для переиспользования.

import { Eyebrow, Punch, R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

const ASSETS: { label: string; sum: string }[] = [
  { label: "Сайт", sum: "150 000" },
  { label: "Бот", sum: "200 000" },
  { label: "Брендинг", sum: "150 000" },
  { label: "Услуги по сборке", sum: "120 000" },
  { label: "Менеджмент Авито", sum: "100 000" },
];

export function SlideContribution({ index = "06" }: { index?: string } = {}) {
  return (
    <Slide id="contribution" theme="dark">
      <Rise>
        <Eyebrow index={index}>Наш вклад</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[24ch] font-sans text-display-2">
        Мы уже в&nbsp;деле — деньгами и&nbsp;работой.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[60ch] font-sans text-body-lg text-mute">
        Помимо 2,3&nbsp;млн вложений основателя, инфраструктура уже готова — по&nbsp;рынку
        это ещё <span className="text-[var(--text)]">~720 000&nbsp;<R /></span>. Всё это тоже
        можно учесть в&nbsp;стоимости.
      </Rise>

      <SlideBody className="mt-8 gap-6">
        {/* Две крупные суммы: деньги + инфраструктура */}
        <Rise delay={0.12} className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-acc bg-[var(--bg-2)] p-5 sm:p-6">
            <span className="font-mono text-caption uppercase text-volt">Деньгами</span>
            <div className="mt-2 font-mono tnum text-[clamp(30px,3.6vw,48px)] leading-none tracking-tight text-volt">
              2 300 000&nbsp;<R />
            </div>
            <span className="mt-2 block font-mono text-caption uppercase text-mute">основатель вложил сам</span>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5 sm:p-6">
            <span className="font-mono text-caption uppercase text-mute">Инфраструктурой</span>
            <div className="mt-2 font-mono tnum text-[clamp(30px,3.6vw,48px)] leading-none tracking-tight text-[var(--text)]">
              ~720 000&nbsp;<R />
            </div>
            <span className="mt-2 block font-mono text-caption uppercase text-mute">уже сделано · по среднему рынку</span>
          </div>
        </Rise>

        {/* Разбивка инфраструктуры — 5 позиций, все ✓ готово */}
        <Rise delay={0.16}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {ASSETS.map((a) => (
              <div key={a.label} className="flex flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4">
                <span className="flex items-center gap-1.5 font-mono text-caption uppercase text-volt">
                  <span aria-hidden>✓</span> готово
                </span>
                <span className="mt-2 font-mono tnum text-h3 leading-none text-[var(--text)]">
                  {a.sum}&nbsp;<R />
                </span>
                <span className="mt-2 font-sans text-[13px] leading-snug text-mute">{a.label}</span>
              </div>
            ))}
          </div>
        </Rise>

        {/* Ведение — на нас, пока нет сотрудников */}
        <Rise delay={0.14}>
          <div className="border-l-2 border-volt pl-5">
            <span className="font-mono text-caption uppercase text-volt">Дальше — на нас</span>
            <p className="mt-2 max-w-[70ch] font-sans text-body-lg leading-snug text-paper">
              Всё ведение — сайт, бот, брендинг, сборка, Авито и&nbsp;соцсети — держим
              сами. Пока нет сотрудников, вся операционка на&nbsp;нас.
            </p>
          </div>
        </Rise>
      </SlideBody>

      <Punch className="mt-6" marker="итог">
        Почти 3&nbsp;млн уже в&nbsp;деле — деньгами и&nbsp;готовой инфраструктурой. Партнёр
        заходит не&nbsp;в&nbsp;идею на&nbsp;бумаге, а&nbsp;в&nbsp;собранную и&nbsp;работающую машину.
      </Punch>
    </Slide>
  );
}
