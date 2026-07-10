"use client";

// СЛАЙД 1 — ОБЛОЖКА.
// Цель: за 3 секунды показать сделку — из 2 млн за три недели рождается
// работающий бизнес. Тёмный кинематографичный слайд на фото курьера,
// как обложка инвест-дека и hero сайта.

import type { ReactNode } from "react";
import Image from "next/image";
import { CountUp, Rise, Slide, R, fmtRu } from "@/components/invest/primitives";

export function SlideCover() {
  return (
    <Slide id="cover" theme="dark">
      {/* Фон — то же фото, что в hero лендинга и на обложке инвест-дека. */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-0 bg-black/35 md:hidden" />
      </div>

      <div className="relative z-10 pt-10 md:pt-0">
        <Rise>
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-white/70">
            Роудмап партнёра · 2026
          </span>
        </Rise>

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

        <Rise delay={0.12} blur={0} as="h1" className="mt-6 max-w-[20ch] font-sans text-display-2 text-paper sm:text-display-1">
          Из 2 000 000&nbsp;<R /> — работающий бизнес за&nbsp;3&nbsp;недели.
        </Rise>

        <Rise delay={0.2} as="p" className="mt-5 max-w-[48ch] font-sans text-body-lg text-white/75">
          Первый шаг: 15&nbsp;велосипедов, своё помещение-мастерская и&nbsp;поток
          с&nbsp;первой недели. Дальше — реинвест и&nbsp;всё крупнее закупки.
        </Rise>

        {/* Три опоры сделки. Мобила — таблица с хайрлайнами, sm+ — три в ряд. */}
        <div className="mt-9 flex flex-col border-t border-white/15 sm:hidden">
          {[
            { d: 0.32, v: <><CountUp to={2} /></>, u: <>млн&nbsp;<R /></>, l: <>первый шаг<br />партнёра</> },
            { d: 0.42, v: <CountUp to={15} />, u: null, l: <>велосипедов<br />5 продажа · 10 аренда</> },
            { d: 0.52, v: <CountUp to={3} />, u: "нед", l: <>от денег<br />до потока</> },
          ].map((st, i) => (
            <Rise key={i} delay={st.d} className="flex items-center justify-between gap-6 border-b border-white/15 py-4">
              <span className="font-mono tnum text-[34px] leading-none tracking-tight text-volt">
                {st.v}
                {st.u && <span className="ml-1 font-sans text-[15px] font-normal text-white/55">{st.u}</span>}
              </span>
              <span className="text-right font-mono text-[11px] uppercase leading-relaxed tracking-[0.06em] text-white/70">
                {st.l}
              </span>
            </Rise>
          ))}
        </div>

        <div className="mt-8 hidden border-t border-white/15 pt-6 sm:grid sm:grid-cols-3 sm:gap-8">
          <CoverStat
            delay={0.32}
            value={<><CountUp to={2} /><span className="ml-1 align-baseline font-sans text-[0.32em] font-normal text-white/55">млн&nbsp;<R /></span></>}
            label={<>первый шаг партнёра — вход в&nbsp;дело</>}
          />
          <CoverStat delay={0.42} value={<CountUp to={15} />} label={<>велосипедов: 5&nbsp;на&nbsp;продажу,<br className="hidden sm:block" /> 10&nbsp;в&nbsp;аренду под&nbsp;выкуп</>} />
          <CoverStat delay={0.52} value={<><CountUp to={3} /><span className="ml-1 align-baseline font-sans text-[0.32em] font-normal text-white/55">нед</span></>} label={<>от денег до&nbsp;первого<br className="hidden sm:block" /> недельного потока</>} />
        </div>

        <Rise delay={0.62} className="mt-8 max-w-[64ch] border-l-2 border-volt pl-4 sm:pl-5">
          <p className="font-sans text-body-lg leading-snug text-paper">
            Это не&nbsp;теория: 21&nbsp;велосипед уже приносит{" "}
            <span className="font-semibold">~520&nbsp;000&nbsp;<R />/мес</span>. Ты входишь
            капиталом — контур запускаем и&nbsp;ведём мы, по&nbsp;отработанной схеме.
          </p>
        </Rise>
      </div>
    </Slide>
  );
}

function CoverStat({ value, label, delay = 0 }: { value: ReactNode; label: ReactNode; delay?: number }) {
  return (
    <Rise as="div" y={20} delay={delay} className="flex flex-col">
      <span className="font-mono tnum text-[clamp(38px,9vw,62px)] leading-[0.85] tracking-tight text-volt">
        {value}
      </span>
      <span className="mt-2.5 font-mono text-caption uppercase leading-relaxed tracking-[0.06em] text-white/70">
        {label}
      </span>
    </Rise>
  );
}
