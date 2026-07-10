"use client";

// ОБЪЕДИНЁННЫЙ ДЕК · СЛАЙД 2 — ОКНО ВОЗМОЖНОСТИ.
// Рынок курьеров взрывается, окно — сейчас. Светлый слайд, GrowthChart.

import { Eyebrow, GrowthChart, Punch, Rise, Slide, SlideBody, Stat } from "@/components/invest/primitives";

export function SlideMarket() {
  return (
    <Slide id="market" theme="light">
      <Rise>
        <Eyebrow index="01">Окно</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[20ch] font-sans text-display-2">
        Рынок курьеров взрывается. Окно — <span className="text-[var(--acc)]">сейчас</span>.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[54ch] font-sans text-body-lg text-mute">
        Доставка растёт, курьеров не&nbsp;хватает, а&nbsp;транспорт нужен каждому.
        Кто зайдёт первым — займёт нишу.
      </Rise>

      <SlideBody className="mt-8 gap-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="grid grid-cols-2 gap-6">
            <Stat value={<>1,5<span className="align-baseline text-[0.42em] text-mute"> млн</span></>} label={<>курьеров в&nbsp;России</>} size="md" />
            <Stat value={<>~200<span className="align-baseline text-[0.42em] text-mute"> тыс</span></>} label={<>дефицит — людей не&nbsp;хватает</>} accent size="md" />
            <Stat value={<>+60%</>} label={<>рост экспресс-доставки</>} size="md" />
            <Stat value={<>470<span className="align-baseline text-[0.42em] text-mute"> млрд ₽</span></>} label={<>рынок доставки, 2024</>} size="md" />
          </div>
          <GrowthChart />
        </div>
      </SlideBody>

      <Punch className="mt-8" marker="вывод">
        Платформы жгут миллиарды за&nbsp;курьеров. Курьеру нужен транспорт —
        и&nbsp;он едет на&nbsp;нашем велосипеде.
      </Punch>
    </Slide>
  );
}
