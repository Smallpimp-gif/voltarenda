"use client";

// Инвест-презентация — общие примитивы.
// Полностью наследуют дизайн-систему сайта («Инженерный журнал»):
// палитра volt / ink / paper, шрифты Onest + JetBrains Mono, токены
// text-display-* / text-h* / text-caption, радиус rounded-lg (24px),
// section-driven темизация через data-theme, tnum для цифр.
//
// Презентация = визуальное продолжение лендинга, единый бренд.

import { createElement, useEffect, type CSSProperties, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import styles from "./invest.module.css";

// Apple easeOutQuart — тот же EASE, что и на сайте (motion-config.ts).
const EASE = [0.22, 1, 0.36, 1] as const;

// ₽ — у моно-стека нет глифа рубля в части весов, поэтому набираем
// его в font-sans. Та же конвенция, что в tariff-card.tsx (renderValue).
export function R() {
  return <span className="font-sans">₽</span>;
}

// ============================================================
// Slide — полноэкранная секция-слайд. Один экран = одна мысль.
// min-h-[100dvh] (не h-): на узких телефонах плотный слайд может
// перерасти вьюпорт и доскроллиться — это лучше, чем обрезка.
// ============================================================
export function Slide({
  id,
  theme,
  children,
  className = "",
  contentClassName = "",
  center = false,
}: {
  id: string;
  theme: "dark" | "light";
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Вертикально центрировать контент (для обложки). Контент-слайды —
      закреплены сверху (justify-start) ради единой высоты заголовка. */
  center?: boolean;
}) {
  return (
    <section
      id={id}
      data-invest-slide
      data-theme={theme}
      // --acc — акцент для ТЕКСТА: volt на тёмных слайдах, тёмно-шартрёз
      // (читаемый) на светлых. Заливки (bg-volt, ценовая полоса) используют
      // volt напрямую и не зависят от этой переменной.
      style={{ ["--acc"]: theme === "dark" ? "#E5FF00" : "#5c6e00" } as CSSProperties}
      // На телефоне — обычный вертикальный документ: без scroll-snap и без
      // принудительной высоты в 100svh (иначе плотные слайды превращаются в
      // «простыни» под снапом, скролл дёргается). Полноэкранные слайды со
      // снапом — только с md (десктоп/планшет).
      className={`invest-slide relative flex w-full flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] md:min-h-[100svh] md:snap-start ${center ? "md:justify-center" : "justify-start"} ${className}`}
    >
      {/* Единый safe-area фрейм. На md растягивается на высоту слайда (flex-1),
          заголовок у верхнего поля, <SlideBody> центрируется в остатке. На
          телефоне — компактные поля, естественный поток сверху вниз. */}
      <div
        className={`invest-safe mx-auto flex w-full max-w-[1560px] flex-col px-gutter pt-14 pb-8 md:flex-1 md:pt-[11vh] md:pb-[6vh] ${
          center ? "md:justify-center" : "justify-start"
        } ${contentClassName}`}
      >
        {children}
      </div>
    </section>
  );
}

// SlideBody — основной контент слайда между заголовком и низом. Растягивается
// (flex-1) и центрируется по вертикали в свободном пространстве под заголовком.
// Это даёт единые верхнее/нижнее поля и оптический баланс на каждом слайде.
export function SlideBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col justify-start md:flex-1 md:justify-center ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// Eyebrow — тех-маркировка слайда: «01 / ОКНО ВОЗМОЖНОСТИ».
// Моно-капс + mute, как у заголовков секций на сайте, с volt-точкой.
// ============================================================
export function Eyebrow({
  index,
  children,
}: {
  index?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 font-mono text-caption uppercase text-mute">
      <span aria-hidden className="inline-block h-1.5 w-1.5 shrink-0 bg-[var(--acc)]" />
      {index && <span className="text-[var(--text)]">{index}</span>}
      <span>{children}</span>
    </div>
  );
}

// ============================================================
// Rise — entrance-обёртка на CSS-анимации (см. invest.module.css).
// blur + y + opacity, тот же EASE. Проигрывается на mount, контент
// всегда виден (не завязан на IntersectionObserver / framer animate).
// ============================================================
type RiseTag = "div" | "p" | "h1" | "h2" | "h3" | "span" | "li" | "ul";

export function Rise({
  children,
  delay = 0,
  y,
  blur,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  /** Стартовый blur входа, px. Крупным display-заголовкам задаём 0 —
      чтобы кириллица не «шиммерила» на входе. По умолчанию 5px (CSS). */
  blur?: number;
  className?: string;
  as?: RiseTag;
}) {
  const style: CSSProperties = {};
  if (delay) style.animationDelay = `${delay}s`;
  if (y != null) (style as Record<string, string>)["--rise-y"] = `${y}px`;
  if (blur != null) (style as Record<string, string>)["--rise-blur"] = `${blur}px`;
  return createElement(
    as,
    { className: `${styles.rise} ${className}`, style },
    children
  );
}

// ============================================================
// CountUp — цифра, которая «набегает» при входе слайда в кадр.
// Императивный animate() — тот же приём, что в калькуляторе сайта.
// ============================================================
export function CountUp({
  to,
  format,
  duration = 1.1,
  delay = 0.2,
  className = "",
}: {
  to: number;
  format?: (v: number) => string;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) =>
    format ? format(v) : String(Math.round(v))
  );

  useEffect(() => {
    // Уважаем prefers-reduced-motion: не «набегаем», сразу конечное число.
    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduce = false;
    }
    if (reduce) {
      mv.set(to);
      return;
    }
    const controls = animate(mv, to, { duration, delay, ease: EASE });
    return controls.stop;
  }, [to, duration, delay, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}

export const fmtRu = (v: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(v));

// ============================================================
// Stat — крупная цифра + единица + подпись. «Крупные цифры,
// минимум текста» — главный приём презентации.
// ============================================================
export function Stat({
  value,
  unit,
  label,
  accent = false,
  size = "lg",
  className = "",
}: {
  value: ReactNode;
  unit?: ReactNode;
  label?: ReactNode;
  accent?: boolean;
  size?: "lg" | "md";
  className?: string;
}) {
  const numCls =
    size === "lg"
      ? "text-[clamp(52px,8vw,108px)]"
      : "text-[clamp(40px,5.5vw,72px)]";
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-mono tnum leading-[0.85] tracking-tight ${numCls} ${
            accent ? "text-volt" : "text-[var(--text)]"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="font-sans text-[clamp(18px,2.4vw,30px)] leading-none text-mute">
            {unit}
          </span>
        )}
      </div>
      {label && (
        <span className="mt-3 max-w-[24ch] font-mono text-caption uppercase leading-relaxed text-mute">
          {label}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Plate — карточка-плитка. rounded-lg + bg-2 + hairline, как все
// карточки сайта (how-it-works, trust-bar, compare).
// ============================================================
export function Plate({
  children,
  className = "",
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-5 sm:p-6 ${
        accent
          ? "border-volt/30 bg-[var(--bg-2)]"
          : "border-[var(--line)] bg-[var(--bg-2)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================
// Punch — «удар-фраза» снизу слайда. Volt-планка слева, крупный
// текст. Эмоциональный акцент в конце каждого слайда.
// ============================================================
export function Punch({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Rise
      as="p"
      className={`border-l-2 border-[var(--acc)] pl-4 font-sans text-h3 leading-[1.2] sm:pl-5 ${className}`}
    >
      {children}
    </Rise>
  );
}

// Hairline-разделитель — как .tariff-divider / border-[var(--line)].
export function Hairline({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-[var(--line)] ${className}`} />;
}

// ============================================================
// GrowthChart — столбчатый график роста курьерских доставок.
// 2020 → 2024 (+46%) → 2030 (пунктирная проекция со стрелкой, без
// выдуманной точной цифры). Столбцы растут при входе в кадр (CSS).
// ============================================================
type Bar = {
  year: string;
  value?: number; // млн доставок; нет → проекция (пунктир)
  label: string; // подпись над столбцом
  pct: number; // высота 0..100
  accent?: boolean;
  projected?: boolean;
};

const BARS: Bar[] = [
  { year: "2020", value: 513, label: "513", pct: 49 },
  { year: "2024", value: 751, label: "751", pct: 72, accent: true },
  { year: "2030", label: "↑", pct: 100, projected: true },
];

export function GrowthChart() {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between font-mono text-caption uppercase text-mute">
        <span>Курьерские доставки в&nbsp;России, млн</span>
        <span className="text-[var(--acc)]">+46% за&nbsp;4&nbsp;года</span>
      </div>

      <div className="mt-4 flex h-[clamp(96px,13vh,150px)] items-end gap-3 sm:gap-5">
        {BARS.map((bar, i) => (
          <div
            key={bar.year}
            className="flex h-full flex-1 flex-col items-stretch justify-end"
          >
            {/* значение над столбцом */}
            <div className="mb-2 flex items-baseline justify-center font-mono tnum leading-none">
              <span
                className={`text-[clamp(20px,3vw,32px)] ${
                  bar.accent || bar.projected ? "text-[var(--acc)]" : "text-[var(--text)]"
                }`}
              >
                {bar.label}
              </span>
            </div>

            {/* столбец */}
            <div
              style={{ height: `${bar.pct}%`, animationDelay: `${0.2 + i * 0.12}s` }}
              className={`${styles.bar} w-full rounded-t-sm ${
                bar.projected
                  ? "border-2 border-dashed border-[var(--acc)]"
                  : bar.accent
                  ? "bg-volt"
                  : "bg-[var(--line-strong)]"
              }`}
            />
            {/* год */}
            <div className="mt-3 text-center font-mono text-caption uppercase text-mute">
              {bar.year}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
