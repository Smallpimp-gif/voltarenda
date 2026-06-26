"use client";

// СЛАЙД 2 — ОКНО ВОЗМОЖНОСТИ.
// Цель: FOMO реальными цифрами. Светлый «инженерный» слайд — данные
// читаются как факт, поэтому им верят. График + плашки-цифры + цена.

import type { ReactNode } from "react";
import { Eyebrow, GrowthChart, Plate, Punch, R, Rise, Slide, SlideBody } from "./primitives";

const DRIVERS: { n: string; title: string; desc: ReactNode }[] = [
  { n: "01", title: "Онлайн-торговля растёт", desc: <>доставке нужны руки и&nbsp;колёса</> },
  { n: "02", title: "Курьер — выгодная профессия", desc: <>медиана ~150&nbsp;000&nbsp;<R />/мес, +100% за&nbsp;4&nbsp;года</> },
  { n: "03", title: "Структурный дефицит", desc: <>не хватает 200&nbsp;тыс. — поток новичков растёт</> },
];

export function SlideMarket() {
  return (
    <Slide id="market" theme="light">
      <Rise>
        <Eyebrow index="01">Окно возможности</Eyebrow>
      </Rise>
      <Rise delay={0.05} as="h2" className="mt-6 max-w-[20ch] font-sans text-display-2">
        Рынок курьеров взрывается. Окно&nbsp;— сейчас.
      </Rise>

      <SlideBody className="mt-10 gap-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* ЛЕВО: график роста + драйверы */}
        <div className="flex flex-col gap-8">
          <Rise delay={0.1}>
            <GrowthChart />
          </Rise>

          <Rise delay={0.16}>
            <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-8">
              {DRIVERS.map((d) => (
                <div key={d.n} className="flex gap-3">
                  <span className="font-mono tnum text-caption text-[var(--acc)]">{d.n}</span>
                  <p className="font-sans text-body leading-snug">
                    <span className="font-semibold">{d.title}</span>{" "}
                    <span className="text-mute">— {d.desc}</span>
                  </p>
                </div>
              ))}
            </div>
          </Rise>
        </div>

        {/* ПРАВО: 4 плашки-цифры */}
        <div className="grid grid-cols-2 gap-6">
          <StatPlate value="1,5 млн" label={<>курьеров — и&nbsp;не хватает ещё ~200&nbsp;тыс.</>} delay={0.12} accent />
          <StatPlate value={<>+60%</>} label={<>экспресс-доставка → 470&nbsp;млрд&nbsp;<R /> в&nbsp;2024</>} delay={0.18} />
          <StatPlate value={<>+87%</>} label={<>оборот доставки, лето&nbsp;2025 к&nbsp;году</>} delay={0.24} />
          <StatPlate value={<>35 трлн</>} unit={<R />} label={<>e-commerce России к&nbsp;2030&nbsp;году</>} delay={0.3} />
        </div>
      </div>

        {/* Ценовое преимущество — горизонтальная полоса, 3 равных сегмента */}
        <Rise delay={0.1}>
          <div className="flex flex-col gap-6 rounded-lg bg-ink p-6 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-baseline gap-3">
            <span className="font-mono tnum text-[clamp(38px,4.6vw,60px)] leading-none text-volt">
              5 000&nbsp;<R />
            </span>
            <span className="font-mono text-caption uppercase leading-tight text-white/55">
              наша&nbsp;цена<br />в&nbsp;неделю
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-mono tnum text-[clamp(20px,2.4vw,28px)] leading-none text-white/40 line-through">
              6 500–7 500&nbsp;<R />
            </span>
            <span className="font-mono text-caption uppercase text-white/40">у&nbsp;конкурентов</span>
          </div>

          <p className="font-sans text-body-lg text-white/85 sm:max-w-[20ch] sm:text-right">
            Дешевле всех — и&nbsp;при этом в&nbsp;плюсе.
          </p>
          </div>
        </Rise>
      </SlideBody>

      {/* Удар-фраза + источники — низ слайда */}
      <div className="mt-10">
        <Punch className="max-w-[56ch] !text-h3">
          Рынок растёт до&nbsp;2030. Серьёзного бренда в&nbsp;нише нет. Через год это
          место будет занято — вопрос только, кем.
        </Punch>
        <Rise delay={0.1} as="p" className="mt-6 font-mono text-[10px] uppercase leading-relaxed tracking-[0.06em] text-mute">
          Источники: Минпромторг / ТАСС · Росстат · TADviser · BusinesStat · ЮKassa · ВТБ · Mordor Intelligence
        </Rise>
      </div>
    </Slide>
  );
}

function StatPlate({
  value,
  unit,
  label,
  delay = 0,
  accent = false,
}: {
  value: ReactNode;
  unit?: ReactNode;
  label: ReactNode;
  delay?: number;
  accent?: boolean;
}) {
  return (
    <Rise delay={delay}>
      <Plate accent={accent} className="flex h-full flex-col justify-between gap-8 !p-6">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-mono tnum text-[clamp(28px,3.6vw,44px)] leading-none tracking-tight ${accent ? "text-[var(--acc)]" : "text-[var(--text)]"}`}>
            {value}
          </span>
          {unit && <span className="font-sans text-[clamp(16px,1.8vw,20px)] leading-none text-mute">{unit}</span>}
        </div>
        <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.04em] text-mute">
          {label}
        </p>
      </Plate>
    </Rise>
  );
}
