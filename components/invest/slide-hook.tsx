"use client";
/* eslint-disable @next/next/no-img-element */

// СЛАЙД 1 — КРЮЧОК (Титул).
// Цель: за 3 секунды зацепить и показать, что бизнес живой и это БРЕНД.
// Тёмный кинематографичный слайд на фото курьера (как hero сайта).

import type { ReactNode } from "react";
import Image from "next/image";
import { CountUp, Rise, Slide, R, fmtRu } from "./primitives";

// Логотипы партнёров в моно-белый под тёмную обложку (filter поверх фирменного цвета).
const WHITE = { filter: "brightness(0) invert(1)" };

export function SlideHook() {
  return (
    <Slide id="hook" theme="dark">
      {/* Фон — то же фото, что в hero лендинга. Мгновенная связь с брендом. */}
      <div aria-hidden className="absolute inset-0 z-0">
        <Image
          src="/rider.webp"
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Скрим — курьер виден справа-по-центру, текст читается на
            затемнении слева/снизу. То же product-forward решение, что в
            hero сайта. (В этом preview фото не рендерится — окружение;
            в реальном браузере и на проде фото видно.) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative z-10">
        <Rise>
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-white/70">
            Инвестиционное предложение · 2026
          </span>
        </Rise>

        {/* Лого-вордмарк бренда — родной жёлтый #EAFF02 на чёрном */}
        <Rise delay={0.06} className="mt-5">
          <Image
            src="/logo.svg"
            alt="Вольтаренда"
            width={520}
            height={48}
            priority
            className="h-[clamp(26px,4.4vw,46px)] w-auto"
          />
        </Rise>

        <Rise delay={0.12} blur={0} as="h1" className="mt-5 max-w-[20ch] font-sans text-display-2 text-paper sm:text-display-1">
          Бренд электровелосипедов, который захватывает рынок доставки.
        </Rise>

        <Rise delay={0.2} as="p" className="mt-4 max-w-[46ch] font-sans text-body-lg text-white/75">
          Мы не прокат. Аренда — механизм входа в&nbsp;рынок. Бренд — то, что
          закрепляет нас в&nbsp;нише навсегда.
        </Rise>

        {/* Цифры тяги. На телефоне выручка — на всю ширину, дарксторы и
            курьеры в 2 столбца под ней; с sm — три в ряд. */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/15 pt-6 sm:grid-cols-3 sm:gap-8">
          <HookStat
            delay={0.32}
            className="col-span-2 sm:col-span-1"
            value={
              <>
                ~<CountUp to={470000} format={fmtRu} />
                <span className="ml-1 align-baseline font-sans text-[0.32em] font-normal tracking-normal text-white/55">
                  <R />/мес
                </span>
              </>
            }
            label={<>живой поток&nbsp;— 19 велосипедов уже приносят деньги</>}
          />
          <HookStat delay={0.42} value={<CountUp to={16} />} label={<>дарксторов-партнёров<br className="hidden sm:block" /> уже подключены</>} />
          <HookStat delay={0.52} value={<><span className="text-mute">~</span><CountUp to={250} /></>} label={<>курьеров в досягаемости<br className="hidden sm:block" /> через одного партнёра</>} />
        </div>

        {/* Дарксторы-партнёры — ровный ряд логотипов под цифрами */}
        <Rise delay={0.58} className="mt-6 flex items-center gap-x-6">
          <span className="shrink-0 font-mono text-caption uppercase tracking-[0.08em] text-white/60">
            Партнёры
          </span>
          <span aria-hidden className="h-5 w-px bg-white/15" />
          <img src="/logos/samokat.svg" alt="Самокат" className="h-[28px] w-auto opacity-90" style={WHITE} />
          <img src="/logos/ozon.svg" alt="Озон Фреш" className="h-[21px] w-auto opacity-90" style={WHITE} />
        </Rise>

        {/* Свежая тяга — мандат Самоката = прямой поток клиентов.
            На десктопе с невысоким окном врезка не помещается в экран
            (обложка обязана влезать целиком) — прячем; факт 16/250 всё
            равно есть в цифрах выше и на слайде клиентов. */}
        <Rise
          delay={0.64}
          className="mt-6 max-w-[70ch] border-l-2 border-volt pl-4 sm:pl-5 [@media(min-width:768px)_and_(max-height:919px)]:hidden"
        >
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-volt">
            Прямой поток клиентов · свежее
          </span>
          <p className="mt-2 font-sans text-body-lg leading-snug text-paper">
            Самокат пересаживает всех курьеров на электровелосипеды:{" "}
            <span className="font-semibold">16&nbsp;дарксторов</span>-партнёров,{" "}
            <span className="font-semibold">250&nbsp;курьеров</span> — и&nbsp;нашу
            аренду предлагают им первыми.
          </p>
        </Rise>
      </div>
    </Slide>
  );
}

function HookStat({
  value,
  label,
  delay = 0,
  className = "",
}: {
  value: ReactNode;
  label: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <Rise as="div" y={20} delay={delay} className={`flex flex-col ${className}`}>
      <span className="font-mono tnum text-[clamp(38px,9vw,62px)] leading-[0.85] tracking-tight text-volt">
        {value}
      </span>
      <span className="mt-2.5 font-mono text-caption uppercase leading-relaxed tracking-[0.06em] text-white/70">
        {label}
      </span>
    </Rise>
  );
}
