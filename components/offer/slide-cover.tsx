"use client";
/* eslint-disable @next/next/no-img-element */

// ОБЪЕДИНЁННЫЙ ДЕК · СЛАЙД 1 — ОБЛОЖКА.
// Оба пути в одном: большой вход (10 млн) и тест (2 млн), доля 20%.
// Тёмная кинематографичная обложка на фото курьера — как /invest и /partner.

import type { ReactNode } from "react";
import Image from "next/image";
import { CountUp, Rise, Slide, R, fmtRu } from "@/components/invest/primitives";

const WHITE = { filter: "brightness(0) invert(1)" };

export function SlideCover() {
  return (
    <Slide id="cover" theme="dark">
      <div aria-hidden className="absolute inset-0 z-0">
        <Image src="/rider.webp" alt="" fill priority quality={85} sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-0 bg-black/35 md:hidden" />
      </div>

      <div className="relative z-10 pt-10 md:pt-0">
        <Rise>
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-white/70">
            Предложение · 2026
          </span>
        </Rise>

        <Rise delay={0.06} className="mt-6">
          <Image src="/logo.svg" alt="Вольтаренда" width={520} height={48} priority className="h-[clamp(26px,4.4vw,46px)] w-auto" />
        </Rise>

        <Rise delay={0.12} blur={0} as="h1" className="mt-6 max-w-[22ch] font-sans text-display-2 text-paper sm:text-display-1">
          Бренд, который захватывает рынок доставки. Зайди — большим шагом или тестом.
        </Rise>

        <Rise delay={0.2} as="p" className="mt-5 max-w-[52ch] font-sans text-body-lg text-white/75">
          Аренда, выкуп и&nbsp;продажа электровелосипедов для курьеров. Доля{" "}
          <span className="font-semibold text-paper">20%</span> — заходишь на&nbsp;10&nbsp;млн
          сразу или тестируешь с&nbsp;2&nbsp;млн. Всё обсуждаемо.
        </Rise>

        {/* Живая тяга — как в инвест-деке */}
        <div className="mt-9 flex flex-col border-t border-white/15 sm:hidden">
          {[
            { d: 0.32, v: <>~<CountUp to={520000} format={fmtRu} /></>, u: <><R />/мес</>, l: <>живой поток<br />с 21 велика</> },
            { d: 0.42, v: <CountUp to={16} />, u: null, l: <>дарксторов-<br />партнёров</> },
            { d: 0.52, v: <>~<CountUp to={250} /></>, u: null, l: <>курьеров через<br />одного партнёра</> },
          ].map((st, i) => (
            <Rise key={i} delay={st.d} className="flex items-center justify-between gap-6 border-b border-white/15 py-4">
              <span className="font-mono tnum text-[30px] leading-none tracking-tight text-volt">
                {st.v}
                {st.u && <span className="ml-1 font-sans text-[14px] font-normal text-white/55">{st.u}</span>}
              </span>
              <span className="text-right font-mono text-[11px] uppercase leading-relaxed tracking-[0.06em] text-white/70">{st.l}</span>
            </Rise>
          ))}
        </div>

        <div className="mt-8 hidden border-t border-white/15 pt-6 sm:grid sm:grid-cols-3 sm:gap-8">
          <CoverStat delay={0.32} value={<>~<CountUp to={520000} format={fmtRu} /><span className="ml-1 align-baseline font-sans text-[0.32em] font-normal text-white/55"><R />/мес</span></>} label={<>живой поток — 21&nbsp;велик уже приносит деньги</>} />
          <CoverStat delay={0.42} value={<CountUp to={16} />} label={<>дарксторов-партнёров<br className="hidden sm:block" /> уже подключены</>} />
          <CoverStat delay={0.52} value={<><span className="text-mute">~</span><CountUp to={250} /></>} label={<>курьеров в&nbsp;досягаемости<br className="hidden sm:block" /> через одного партнёра</>} />
        </div>

        <Rise delay={0.58} className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-7 sm:gap-x-6">
          <span className="shrink-0 font-mono text-caption uppercase tracking-[0.08em] text-white/60">Партнёры</span>
          <span aria-hidden className="hidden h-5 w-px bg-white/15 sm:block" />
          <img src="/logos/samokat.svg" alt="Самокат" className="h-[21px] w-auto opacity-90 sm:h-[28px]" style={WHITE} />
          <img src="/logos/ozon.svg" alt="Озон Фреш" className="h-4 w-auto opacity-90 sm:h-[21px]" style={WHITE} />
        </Rise>
      </div>
    </Slide>
  );
}

function CoverStat({ value, label, delay = 0 }: { value: ReactNode; label: ReactNode; delay?: number }) {
  return (
    <Rise as="div" y={20} delay={delay} className="flex flex-col">
      <span className="font-mono tnum text-[clamp(34px,8vw,58px)] leading-[0.85] tracking-tight text-volt">{value}</span>
      <span className="mt-2.5 font-mono text-caption uppercase leading-relaxed tracking-[0.06em] text-white/70">{label}</span>
    </Rise>
  );
}
