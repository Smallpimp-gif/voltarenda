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
        <Rise delay={0.06} className="mt-6">
          <Image
            src="/logo.svg"
            alt="Вольтаренда"
            width={520}
            height={48}
            priority
            className="h-[clamp(26px,4.4vw,46px)] w-auto"
          />
        </Rise>

        <Rise delay={0.12} as="h1" className="mt-6 max-w-[20ch] font-sans text-display-2 text-paper">
          Бренд электровелосипедов, который захватывает рынок доставки.
        </Rise>

        <Rise delay={0.2} as="p" className="mt-5 max-w-[46ch] font-sans text-body-lg text-white/75">
          Мы не прокат. Аренда — механизм захвата рынка. Бренд — то, что
          закрепляет нас в&nbsp;нише навсегда.
        </Rise>

        {/* 3 цифры — бизнес уже живой */}
        <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-8 sm:gap-8">
          <HookStat
            delay={0.32}
            value={
              <>
                ~<CountUp to={470000} format={fmtRu} />
                <span className="ml-1 align-baseline font-sans text-[0.3em] font-normal tracking-normal text-white/55">
                  <R />/мес
                </span>
              </>
            }
            label={<>живой поток&nbsp;— 19 велосипедов<br className="hidden sm:block" /> уже приносят деньги</>}
          />
          <HookStat delay={0.42} value={<CountUp to={17} />} label={<>дарксторов-партнёров<br className="hidden sm:block" /> уже подключены</>} />
          <HookStat delay={0.52} value={<><span className="text-mute">~</span><CountUp to={275} /></>} label={<>курьеров в досягаемости<br className="hidden sm:block" /> через одного партнёра</>} />
        </div>

        {/* Дарксторы-партнёры — ровный ряд логотипов под цифрами */}
        <Rise delay={0.58} className="mt-7 flex items-center gap-x-6">
          <span className="shrink-0 font-mono text-caption uppercase tracking-[0.08em] text-white/40">
            Партнёры
          </span>
          <span aria-hidden className="h-5 w-px bg-white/15" />
          <img src="/logos/samokat.svg" alt="Самокат" className="h-[28px] w-auto opacity-90" style={WHITE} />
          <img src="/logos/ozon.svg" alt="Озон Фреш" className="h-[21px] w-auto opacity-90" style={WHITE} />
        </Rise>

        {/* Свежая тяга — мандат Самоката = прямой поток клиентов */}
        <Rise delay={0.2} className="mt-8 max-w-[70ch] border-l-2 border-volt pl-4 sm:pl-5">
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-volt">
            Прямой поток клиентов · свежее
          </span>
          <p className="mt-2 font-sans text-body-lg leading-snug text-paper">
            Самокат пересаживает всех курьеров на электровелосипеды:{" "}
            <span className="font-semibold">16&nbsp;складов</span>-партнёров,{" "}
            <span className="font-semibold">250&nbsp;курьеров</span> — и&nbsp;нашу
            аренду предлагают им первыми.
          </p>
          <p className="mt-2.5 font-mono text-caption uppercase leading-relaxed text-white/45">
            Бренд, сайт, электронные договоры — мы строим систему, а&nbsp;не разовую перепродажу.
          </p>
        </Rise>
      </div>
    </Slide>
  );
}

function HookStat({ value, label, delay = 0 }: { value: ReactNode; label: ReactNode; delay?: number }) {
  return (
    <Rise as="div" y={20} delay={delay} className="flex flex-col">
      <span className="font-mono tnum text-[clamp(34px,5vw,62px)] leading-[0.85] tracking-tight text-volt">
        {value}
      </span>
      <span className="mt-2.5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.06em] text-white/60">
        {label}
      </span>
    </Rise>
  );
}
