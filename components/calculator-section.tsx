"use client";

// Секция "Калькулятор дохода" — Этап 5 шлифовки.
// Три слайдера (доставок в день / средний чек / дней в неделю), реальная формула
// расчёта прибыли в реальном времени, count-up анимация, scroll-reveal.

import { useEffect, useRef, useState } from "react";
import { useApply } from "./apply";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { EASE, SMOOTH_SCROLL } from "./motion-config";

// Тариф "Неделя" — базовый для расчёта окупаемости
const WEEKLY_TARIFF = 5500;

// Пресеты по сервисам доставки — усреднённые цифры типичного курьера.
// Подбирались на глаз по публичным интервью курьеров и реддит-тредам,
// пользователь может крутить слайдеры дальше.
const PRESETS: {
  key: string;
  label: string;
  deliveries: number;
  avgCheck: number;
  daysPerWeek: number;
}[] = [
  { key: "yeda", label: "ЯНДЕКС.ЕДА", deliveries: 18, avgCheck: 310, daysPerWeek: 6 },
  { key: "samokat", label: "САМОКАТ", deliveries: 22, avgCheck: 220, daysPerWeek: 6 },
  { key: "kuper", label: "КУПЕР", deliveries: 16, avgCheck: 340, daysPerWeek: 5 },
  { key: "vkusvill", label: "ВКУСВИЛЛ", deliveries: 14, avgCheck: 360, daysPerWeek: 5 },
  { key: "ozon", label: "ОЗОН", deliveries: 20, avgCheck: 250, daysPerWeek: 6 },
];

function formatRub(n: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export function CalculatorSection() {
  const { open: openApply } = useApply();
  const [deliveries, setDeliveries] = useState(15);
  const [avgCheck, setAvgCheck] = useState(280);
  const [daysPerWeek, setDaysPerWeek] = useState(6);

  const sectionRef = useRef<HTMLElement>(null);

  // Apple-style scroll-driven reveal через smoothed progress
  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 10%"],
  });
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // Быстрые reveal'ы — все элементы дохода до 35% прогресса, чтобы
  // пользователь сразу видел карточки а не пустой блок.
  const headerOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 1],
    [0, 1, 1],
    { ease: EASE }
  );
  const headerScale = useTransform(
    scrollYProgress,
    [0, 0.2],
    [0.97, 1],
    { ease: EASE }
  );
  const headerBlurVal = useTransform(
    scrollYProgress,
    [0, 0.2],
    [4, 0],
    { ease: EASE }
  );
  const headerBlur = useMotionTemplate`blur(${headerBlurVal}px)`;

  // Левая колонка (inputs) — стартует с headerом, завершается на 30%
  const leftOpacity = useTransform(scrollYProgress, [0.05, 0.3], [0, 1], { ease: EASE });
  const leftScale = useTransform(scrollYProgress, [0.05, 0.3], [0.96, 1], { ease: EASE });
  const leftBlurVal = useTransform(scrollYProgress, [0.05, 0.3], [6, 0], { ease: EASE });
  const leftBlur = useMotionTemplate`blur(${leftBlurVal}px)`;

  // Правая колонка (results) — с крохотным stagger +5%
  const rightOpacity = useTransform(scrollYProgress, [0.1, 0.35], [0, 1], { ease: EASE });
  const rightScale = useTransform(scrollYProgress, [0.1, 0.35], [0.96, 1], { ease: EASE });
  const rightBlurVal = useTransform(scrollYProgress, [0.1, 0.35], [6, 0], { ease: EASE });
  const rightBlur = useMotionTemplate`blur(${rightBlurVal}px)`;

  // Формула недельного дохода и прибыли
  const weeklyIncome = deliveries * avgCheck * daysPerWeek;
  const weeklyNet = Math.max(0, weeklyIncome - WEEKLY_TARIFF);
  const dailyIncome = deliveries * avgCheck;
  const paybackDays = dailyIncome > 0 ? WEEKLY_TARIFF / dailyIncome : 0;

  // Анимированная цифра чистой прибыли — count-up через framer-motion
  const netCount = useMotionValue(0);
  const netDisplay = useTransform(netCount, (v) => formatRub(v));

  useEffect(() => {
    const controls = animate(netCount, weeklyNet, {
      duration: 0.6,
      ease: EASE,
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyNet]);

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      id="calc"
      className="relative bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="mx-auto max-w-content px-gutter pt-section-y pb-16 md:pb-section-y">
        <motion.div
          style={{
            opacity: headerOpacity,
            scale: headerScale,
            filter: headerBlur,
          }}
          className="border-b border-[var(--line)] pb-4"
        >
          <span className="font-mono text-caption uppercase text-mute">
            04 / КАЛЬКУЛЯТОР
          </span>
          <h2 className="mt-2 font-sans text-h2">Сколько можно заработать</h2>
          <p className="mt-2 max-w-[52ch] font-sans text-body text-mute">
            Подвигай ползунки — увидишь реальную прибыль за неделю на велике Вольтаренды.
          </p>
        </motion.div>

        {/* ============================================================
            MOBILE: одна карточка (результат + слайдеры + пресеты)
            + вторая карточка (спеки + CTA)
            ============================================================ */}
        <div className="mt-8 flex flex-col gap-4 lg:hidden">
          <motion.div
            style={{ opacity: leftOpacity, scale: leftScale, filter: leftBlur }}
            className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4"
          >
            {/* Результат наверху — сразу видно число */}
            <div className="font-mono text-caption uppercase text-mute">
              ЧИСТЫМИ / НЕДЕЛЯ
            </div>
            <div className="mt-2 flex items-baseline gap-2 whitespace-nowrap">
              <motion.span className="font-mono tnum text-[clamp(48px,13vw,72px)] leading-none tracking-tight">
                {netDisplay}
              </motion.span>
              <span className="font-sans text-[clamp(24px,5vw,36px)] leading-none text-mute">₽</span>
            </div>
            <span className="mt-1 font-mono text-caption uppercase text-mute">
              после тарифа · окупаемость {Number.isFinite(paybackDays) ? `${paybackDays.toFixed(1)} дн.` : "—"}
            </span>

            <div className="mt-3 h-px w-full bg-[var(--line)]" />

            {/* Слайдеры */}
            <div className="mt-4 flex flex-col gap-4">
              <SliderInput
                label="доставок в день"
                min={5} max={25} step={1}
                value={deliveries} onChange={setDeliveries}
              />
              <SliderInput
                label="средний чек"
                min={150} max={600} step={10}
                value={avgCheck} onChange={setAvgCheck} unit="₽"
              />
              <SliderInput
                label="дней в неделю"
                min={3} max={7} step={1}
                value={daysPerWeek} onChange={setDaysPerWeek}
              />
            </div>

            <div className="mt-4 h-px w-full bg-[var(--line)]" />

            {/* Пресеты — снизу под слайдерами */}
            <div className="mt-4">
              <span className="font-mono text-caption uppercase text-mute">СЕРВИС</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESETS.map((p) => {
                  const active =
                    deliveries === p.deliveries &&
                    avgCheck === p.avgCheck &&
                    daysPerWeek === p.daysPerWeek;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        setDeliveries(p.deliveries);
                        setAvgCheck(p.avgCheck);
                        setDaysPerWeek(p.daysPerWeek);
                      }}
                      className={`rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-quick ease-out-soft ${
                        active
                          ? "border-volt bg-volt/10 text-volt"
                          : "border-white/30 bg-white/5 text-[var(--text)] hover:border-volt hover:text-volt"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 h-px w-full bg-[var(--line)]" />

            {/* CTA + формула — в той же карточке */}
            <button
              type="button"
              onClick={() => openApply()}
              className="btn-cta btn-cta-volt group/cta mt-4 inline-flex w-full items-center justify-between rounded-md bg-volt px-5 py-4 font-mono text-caption uppercase text-ink hover:bg-volt-hover"
            >
              <span>Начать зарабатывать</span>
              <span aria-hidden className="font-sans text-base transition-transform duration-base ease-out-soft group-hover/cta:translate-x-1">→</span>
            </button>

            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
              {deliveries} × {avgCheck} ₽ × {daysPerWeek} − {formatRub(WEEKLY_TARIFF)} ₽
              {" = "}
              <span className="text-[var(--text)]">{formatRub(weeklyNet)} ₽</span>
              {" · "}расчёт оценочный, без налога самозанятого 6%
            </p>
          </motion.div>
        </div>

        {/* ============================================================
            DESKTOP: 2-column layout (как было)
            ============================================================ */}
        <div className="mt-8 hidden gap-8 lg:grid lg:grid-cols-2">
          {/* ЛЕВАЯ колонка — инпуты */}
          <motion.div
            style={{ opacity: leftOpacity, scale: leftScale, filter: leftBlur }}
            className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-8 md:p-10"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-caption uppercase text-mute">ВВОДНЫЕ</span>
              <span className="font-mono text-caption uppercase text-mute">СЕРВИС</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active =
                  deliveries === p.deliveries &&
                  avgCheck === p.avgCheck &&
                  daysPerWeek === p.daysPerWeek;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setDeliveries(p.deliveries);
                      setAvgCheck(p.avgCheck);
                      setDaysPerWeek(p.daysPerWeek);
                    }}
                    className={`rounded-md border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-quick ease-out-soft ${
                      active
                        ? "border-volt bg-volt/10 text-volt"
                        : "border-white/30 bg-white/5 text-[var(--text)] hover:border-volt hover:text-volt"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-10 flex flex-col gap-10">
              <SliderInput
                label="доставок в день"
                min={5} max={25} step={1}
                value={deliveries} onChange={setDeliveries}
              />
              <SliderInput
                label="средний чек за доставку"
                min={150} max={600} step={10}
                value={avgCheck} onChange={setAvgCheck} unit="₽"
              />
              <SliderInput
                label="дней в неделю"
                min={3} max={7} step={1}
                value={daysPerWeek} onChange={setDaysPerWeek}
              />
            </div>
          </motion.div>

          {/* ПРАВАЯ колонка — результат */}
          <motion.article
            style={{ opacity: rightOpacity, scale: rightScale, filter: rightBlur }}
            className="flex flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-8"
          >
            <header className="flex items-center justify-between">
              <span className="font-mono text-caption uppercase text-mute">РЕЗУЛЬТАТ / 01</span>
              <span className="font-mono text-caption uppercase text-mute">ВОЛЬТ U2</span>
            </header>
            <h3 className="mt-16 font-sans text-h2">Чистыми</h3>
            <div className="mt-3 flex flex-col">
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <motion.span className="font-mono tnum text-[clamp(44px,5vw,68px)] leading-none tracking-tight">
                  {netDisplay}
                </motion.span>
                <span className="font-sans text-[clamp(24px,3vw,36px)] leading-none text-mute">₽</span>
              </div>
              <span className="mt-3 font-mono text-caption uppercase text-mute">/ ПОСЛЕ ТАРИФА</span>
            </div>
            <div className="mt-10 h-px w-full bg-[var(--line)]" />
            <dl className="mt-6 flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-4 font-mono text-caption uppercase">
                <dt className="text-mute">ВСЕГО ЗАРАБОТАЛ</dt>
                <dd className="tnum text-right">{formatRub(weeklyIncome)} <span className="font-sans">₽</span></dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 font-mono text-caption uppercase">
                <dt className="text-mute">МИНУС АРЕНДА (НЕДЕЛЯ)</dt>
                <dd className="tnum text-right">−{formatRub(WEEKLY_TARIFF)} <span className="font-sans">₽</span></dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 font-mono text-caption uppercase">
                <dt className="text-mute">ОКУПАЕМОСТЬ ТАРИФА</dt>
                <dd className="tnum text-right">
                  {Number.isFinite(paybackDays) ? `${paybackDays.toFixed(1)} ДН.` : "—"}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => openApply()}
              className="btn-cta btn-cta-volt group/cta mt-12 inline-flex items-center justify-between rounded-md bg-volt px-5 py-4 font-mono text-caption uppercase text-ink hover:bg-volt-hover"
            >
              <span>Начать зарабатывать</span>
              <span aria-hidden className="font-sans text-base transition-transform duration-base ease-out-soft group-hover/cta:translate-x-1">→</span>
            </button>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
              {deliveries} × {avgCheck} ₽ × {daysPerWeek} − {formatRub(WEEKLY_TARIFF)} ₽
              {" = "}
              <span className="text-[var(--text)]">{formatRub(weeklyNet)} ₽</span>
              {" · "}расчёт оценочный, без налога самозанятого 6%
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Кастомный слайдер — невидимый native input + волт-fill + thumb
// ============================================================

function SliderInput({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit = "",
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-caption uppercase">
        <span className="text-mute">{label}</span>
        <span className="tnum text-[var(--text)]">
          {value}{unit && ` ${unit}`}
        </span>
      </div>

      <div className="relative mt-2 flex h-8 items-center">
        <div className="absolute inset-x-0 h-2">
          <div className="absolute inset-0 rounded-pill bg-[var(--line-strong)]" />
          <div
            className="absolute inset-y-0 left-0 rounded-pill bg-volt"
            style={{ width: `${percent}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-pill border-2 border-[var(--bg)] bg-volt shadow-lg"
            style={{ left: `calc(${percent}% - 10px)` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </div>
    </div>
  );
}

