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

// Мини-стат для панели «уже с нами»: крупная моно-цифра + подпись.
function ClientStat({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono tnum text-h3 leading-none text-[var(--text)]">{value}</span>
      <span className="font-mono text-caption uppercase text-mute">{unit}</span>
    </div>
  );
}

export function SlideClients() {
  return (
    <Slide id="clients" theme="dark">
      <Rise>
        <Eyebrow index="03">Пищевая цепочка</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[24ch] font-sans text-display-2">
        Курьеры — только вход. Дальше — вся доставка.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-4 max-w-[60ch] font-sans text-body-lg text-mute">
        Мы не ставим на&nbsp;одну платформу. Кто&nbsp;бы ни&nbsp;выиграл войну за&nbsp;доставку —
        курьер едет на&nbsp;нашем велосипеде.
      </Rise>

      <SlideBody className="mt-6">
        <div className="grid gap-9 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* ЛЕВО: пищевая цепочка — 3 слоя, наш в основании (volt) */}
          <div className="flex flex-col">
            <span className="font-mono text-caption uppercase text-mute">Цепочка доставки</span>
            <div className="mt-4 flex flex-col gap-3">
              {LAYERS.map((l, i) => (
                <Rise key={l.title} delay={0.12 + i * 0.08}>
                  <div
                    className={`flex items-start gap-5 rounded-lg border px-5 py-4 ${
                      l.ours ? "border-volt bg-volt text-ink" : "border-[var(--line)] bg-[var(--bg-2)]"
                    }`}
                  >
                    <span
                      className={`mt-1 w-20 shrink-0 whitespace-nowrap font-mono text-caption uppercase ${
                        l.ours ? "text-ink/70" : "text-mute"
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

              {/* Самокат — канал-партнёр. Тёмная карточка с volt-рамкой:
                  единственная сплошная volt-заливка слайда — наш слой слева. */}
              <div className="mt-4 rounded-lg border border-volt/50 bg-[var(--bg-2)] p-5 text-[var(--text)]">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <img src="/logos/samokat.svg" alt="Самокат" className="h-7 w-auto sm:h-8" style={WHITE} />
                  <span className="shrink-0 font-mono text-caption uppercase text-mute">канал-партнёр</span>
                </div>
                <div className="mt-3 flex items-center gap-8 border-t border-[var(--line)] pt-3">
                  <ClientStat value="16" unit="дарксторов" />
                  <ClientStat value="250" unit="курьеров" />
                </div>
                <p className="mt-3 font-mono text-caption uppercase leading-relaxed text-mute">
                  нашу аренду предлагают первой
                </p>
              </div>

              {/* Диверсификация: дарксторы — ускоритель, не единственный
                  источник заявок. Де-риск для инвестора. */}
              <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
                <span className="font-mono text-caption uppercase text-mute">
                  канал — не единственный
                </span>
                <p className="mt-2 font-sans text-body leading-snug text-mute">
                  Заявки идут и напрямую — сайт, Telegram-бот, рекомендации
                  курьеров. Просядет один канал —{" "}
                  <span className="font-semibold text-[var(--text)]">поток останется</span>.
                </p>
              </div>

              {/* Лого-ряд — курьеры этих сервисов наши арендаторы */}
              <div className="mt-auto pt-4">
                <span className="font-mono text-caption uppercase text-mute">
                  Курьеры этих сервисов — наши арендаторы
                </span>
                <div className="mt-5 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-4">
                  {RENTER_LOGOS.map((l) => (
                    <span key={l.slug} className="flex h-7 items-center">
                      <img
                        src={`/logos/${l.slug}.svg`}
                        alt={l.alt}
                        className={`${l.h} w-auto opacity-90`}
                        style={WHITE}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Rise>
        </div>
      </SlideBody>

      <Punch className="mt-5" marker="pick & shovel">
        Золотая лихорадка идёт — <span className="text-volt">а&nbsp;мы продаём лопаты</span>.
      </Punch>
    </Slide>
  );
}
