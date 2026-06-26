"use client";
/* eslint-disable @next/next/no-img-element */

// СЛАЙД 3 — ПИЩЕВАЯ ЦЕПОЧКА + РЕАЛЬНАЯ ТЯГА (флекс брендами).
// Слева: где мы в цепочке доставки — наш слой (транспорт) в основании.
// Справа: кто уже с нами. Самокат — канал-партнёр (реальные цифры из ТЗ,
// лого на volt-плашке), остальные сервисы — лого-ряд курьеров-арендаторов.
// Логотипы — настоящие SVG в /public/logos, приведены к моно (filter):
// на тёмном — белые, на volt-плашке — чёрные. Pick-and-shovel.

import type { ReactNode } from "react";
import { Eyebrow, Punch, Rise, Slide, SlideBody } from "./primitives";

// Слои пищевой цепочки доставки (сверху вниз). Наш слой — нижний, фундамент.
const LAYERS: { tag: string; title: string; desc: ReactNode; ours?: boolean }[] = [
  {
    tag: "Спрос",
    title: "Платформы",
    desc: <>Сервисы доставки и&nbsp;маркетплейсы — жгут миллиарды в&nbsp;войне за&nbsp;клиента.</>,
  },
  {
    tag: "Труд",
    title: "Курьеры",
    desc: <>1,5&nbsp;млн человек, дефицит ~200&nbsp;тыс. Их переманивают все платформы.</>,
  },
  {
    tag: "Наш слой",
    title: "Транспорт",
    desc: <>Велосипед под каждым курьером. Платформы меняются — спрос на&nbsp;колёса нет.</>,
    ours: true,
  },
];

// Лого-ряд: ключевые сервисы, на которые работают курьеры-арендаторы.
// h — оптическая высота (разные пропорции вордмарков выравниваем по виду).
const RENTER_LOGOS: { slug: string; alt: string; h: string }[] = [
  { slug: "yandex-eda", alt: "Яндекс Еда", h: "h-[26px]" },
  { slug: "ozon", alt: "Озон", h: "h-[24px]" },
  { slug: "kuper", alt: "Купер", h: "h-[22px]" },
  { slug: "vkusvill", alt: "ВкусВилл", h: "h-[20px]" },
];

const WHITE = { filter: "brightness(0) invert(1)" };
const INK = { filter: "brightness(0)" };

export function SlideClients() {
  return (
    <Slide id="clients" theme="dark">
      <Rise>
        <Eyebrow index="02">Пищевая цепочка</Eyebrow>
      </Rise>
      <Rise delay={0.05} as="h2" className="mt-6 max-w-[24ch] font-sans text-display-2">
        Курьеры — только вход. Дальше — вся доставка.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[60ch] font-sans text-body-lg text-mute">
        Мы не ставим на&nbsp;одну платформу. Кто&nbsp;бы ни&nbsp;выиграл войну за&nbsp;доставку —
        курьер едет на&nbsp;нашем велосипеде.
      </Rise>

      <SlideBody className="mt-9">
        <div className="grid gap-9 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* ЛЕВО: пищевая цепочка — 3 слоя, наш в основании (volt) */}
          <div className="flex flex-col">
            <span className="font-mono text-caption uppercase text-mute">Цепочка доставки</span>
            <div className="mt-4 flex flex-col gap-3">
              {LAYERS.map((l, i) => (
                <Rise key={l.title} delay={0.12 + i * 0.08}>
                  <div
                    className={`flex items-start gap-5 rounded-lg border p-5 ${
                      l.ours ? "border-volt bg-volt text-ink" : "border-[var(--line)] bg-[var(--bg-2)]"
                    }`}
                  >
                    <span
                      className={`mt-1 w-[4.5rem] shrink-0 font-mono text-caption uppercase ${
                        l.ours ? "text-ink/60" : "text-mute"
                      }`}
                    >
                      {l.tag}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-sans text-h3 leading-tight">{l.title}</h3>
                      <p className={`mt-1.5 font-sans text-body leading-snug ${l.ours ? "text-ink/80" : "text-mute"}`}>
                        {l.desc}
                      </p>
                    </div>
                  </div>
                </Rise>
              ))}
            </div>
          </div>

          {/* ПРАВО: уже с нами — реальная тяга (логотипы партнёров) */}
          <Rise delay={0.2}>
            <div className="flex h-full flex-col">
              <span className="font-mono text-caption uppercase text-mute">Уже с нами</span>

              {/* Самокат — канал-партнёр, лого на volt-плашке */}
              <div className="mt-4 rounded-lg border border-volt bg-volt p-5 text-ink sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <img src="/logos/samokat.svg" alt="Самокат" className="h-8 w-auto sm:h-9" style={INK} />
                  <span className="shrink-0 font-mono text-caption uppercase text-ink/60">канал-партнёр</span>
                </div>
                <p className="mt-4 font-mono text-caption uppercase leading-relaxed text-ink/75">
                  16 дарксторов · 250 курьеров · нашу аренду предлагают первой
                </p>
              </div>

              {/* Лого-ряд — курьеры этих сервисов наши арендаторы */}
              <div className="mt-7">
                <span className="font-mono text-caption uppercase text-mute">
                  Курьеры этих сервисов — наши арендаторы
                </span>
                <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-5">
                  {RENTER_LOGOS.map((l) => (
                    <img
                      key={l.slug}
                      src={`/logos/${l.slug}.svg`}
                      alt={l.alt}
                      className={`${l.h} w-auto opacity-90`}
                      style={WHITE}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Rise>
        </div>
      </SlideBody>

      <Punch className="mt-9 max-w-[64ch]">
        Золотая лихорадка идёт — <span className="text-volt">а&nbsp;мы продаём лопаты</span>.
        Без&nbsp;колёс не&nbsp;едет ни&nbsp;одна платформа.
      </Punch>
    </Slide>
  );
}
