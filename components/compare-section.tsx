"use client";

// Секция "Почему Вольтаренда" — честное сравнение трёх сценариев:
// купить велик / другой прокат / Вольтаренда. Без фейковых бенчмарков,
// только реальные числа и аспекты — курьер сразу видит почему наш
// вариант выгоднее для работы.

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { EASE, SMOOTH_SCROLL } from "./motion-config";
import { useApply } from "./apply";


type Row = {
  label: string;
  buy: string;
  other: string;
  us: string;
};

// Было 7 строк — карточка уходила ниже viewport на мобилке. Оставил
// top-5 решающих для конверсии: цена, запас, залог, замена при поломке,
// ТО. Снятые («подходит для курьера», «возврат денег») дублировали
// оставшиеся по смыслу.
const ROWS: Row[] = [
  { label: "СТАРТОВАЯ ЦЕНА", buy: "150 000 ₽", other: "от 800 ₽/день", us: "от 633 ₽/день" },
  { label: "ЗАПАС ХОДА", buy: "зависит от модели", other: "1 АКБ, 30–50 км", us: "2 АКБ, ~120 км" },
  { label: "ЗАЛОГ", buy: "—", other: "20–30 тыс.", us: "5 000 ₽ возвратный" },
  { label: "ЗАМЕНА ПРИ ПОЛОМКЕ", buy: "—", other: "платно", us: "до 14 дней, бесплатно" },
  { label: "ТО И РЕМОНТ", buy: "сам платишь", other: "за свой счёт", us: "50% на нас" },
];

type Col = {
  key: string;
  index: string;
  title: string;
  subtitle: string;
  accent?: boolean;
};

const COLS: Col[] = [
  {
    key: "us",
    index: "01",
    title: "Вольтаренда",
    subtitle: "Собран под доставку",
    accent: true,
  },
  { key: "buy", index: "02", title: "Купить велик", subtitle: "Дорого, но твой" },
  { key: "other", index: "03", title: "Другой прокат", subtitle: "Массовый шеринг для города" },
];

export function CompareSection() {
  const { open: openApply } = useApply();
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Scroll-tracking для dots
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handler = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const cr = el.getBoundingClientRect();
      const center = cr.left + cr.width / 2;
      let closest = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const b = card.getBoundingClientRect();
        const cardCenter = b.left + b.width / 2;
        const dist = Math.abs(center - cardCenter);
        if (dist < closestDist) {
          closest = i;
          closestDist = dist;
        }
      });
      setActiveIdx(closest);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 10%"],
  });
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // Header
  const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1], { ease: EASE });
  const headerScale = useTransform(scrollYProgress, [0, 0.3], [0.97, 1], { ease: EASE });
  const headerBlurVal = useTransform(scrollYProgress, [0, 0.3], [4, 0], { ease: EASE });
  const headerBlur = useMotionTemplate`blur(${headerBlurVal}px)`;

  // 3 колонки с нарастающим stagger
  const op1 = useTransform(scrollYProgress, [0.1, 0.4], [0, 1], { ease: EASE });
  const sc1 = useTransform(scrollYProgress, [0.1, 0.4], [0.96, 1], { ease: EASE });
  const bl1 = useTransform(scrollYProgress, [0.1, 0.4], [5, 0], { ease: EASE });
  const fil1 = useMotionTemplate`blur(${bl1}px)`;

  const op2 = useTransform(scrollYProgress, [0.14, 0.44], [0, 1], { ease: EASE });
  const sc2 = useTransform(scrollYProgress, [0.14, 0.44], [0.96, 1], { ease: EASE });
  const bl2 = useTransform(scrollYProgress, [0.14, 0.44], [5, 0], { ease: EASE });
  const fil2 = useMotionTemplate`blur(${bl2}px)`;

  const op3 = useTransform(scrollYProgress, [0.18, 0.48], [0, 1], { ease: EASE });
  const sc3 = useTransform(scrollYProgress, [0.18, 0.48], [0.96, 1], { ease: EASE });
  const bl3 = useTransform(scrollYProgress, [0.18, 0.48], [5, 0], { ease: EASE });
  const fil3 = useMotionTemplate`blur(${bl3}px)`;

  const colAnims: {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
    filter: MotionValue<string>;
  }[] = [
    { opacity: op1, scale: sc1, filter: fil1 },
    { opacity: op2, scale: sc2, filter: fil2 },
    { opacity: op3, scale: sc3, filter: fil3 },
  ];

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      id="compare"
      className="relative overflow-hidden bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="mx-auto max-w-content px-gutter py-section-y">
        <motion.div
          style={{
            opacity: headerOpacity,
            scale: headerScale,
            filter: headerBlur,
          }}
          className="flex items-baseline justify-between border-b border-[var(--line)] pb-4"
        >
          <div className="flex flex-col gap-2">
            <span className="font-mono text-caption uppercase text-mute">
              05 / ПОЧЕМУ МЫ
            </span>
            <h2 className="font-sans text-h2">Сравни три варианта</h2>
          </div>
          <span className="hidden max-w-[32ch] text-right font-mono text-caption uppercase text-mute md:inline">
            без маркетинга, только цифры
          </span>
        </motion.div>

        {/* DESKTOP: 3-column grid */}
        <div className="mt-12 hidden gap-6 md:grid md:grid-cols-3">
          {COLS.map((col, i) => (
            <CompareCard key={col.key} col={col} rows={ROWS} anim={colAnims[i]} />
          ))}
        </div>

        {/* MOBILE: snap-carousel, accent-карточка «Вольтаренда» первая */}
        <div className="mt-8 md:hidden">
          <div
            ref={carouselRef}
            className="carousel-scrollbar-hidden flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-gutter pb-2"
          >
            {/* Accent first, then the rest */}
            {[...COLS].sort((a, b) => (a.accent ? -1 : 0) - (b.accent ? -1 : 0)).map((col) => (
              <div key={col.key} className="mr-4 w-[calc(100vw-48px)] shrink-0 snap-start last:mr-0">
                <CompareCard col={col} rows={ROWS} />
              </div>
            ))}
          </div>

          {/* Dots — кликабельные, с scroll-tracking */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {[...COLS].sort((a, b) => (a.accent ? -1 : 0) - (b.accent ? -1 : 0)).map((c, i) => (
              <button
                key={c.key}
                type="button"
                aria-label={`Показать ${c.title}`}
                onClick={() => {
                  const el = carouselRef.current;
                  if (!el) return;
                  const card = el.children[i] as HTMLElement | undefined;
                  if (card) el.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
                }}
                className="flex h-11 items-center justify-center px-2"
              >
                <span
                  className={`h-1.5 rounded-pill transition-all duration-base ease-out-soft ${
                    i === activeIdx ? "w-6 bg-[var(--text)]" : "w-1.5 bg-[var(--line-strong)]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* CTA — сразу под карточкой на мобилке (mt-6), воздух md+ */}
        <div className="mt-6 flex justify-center md:mt-12">
          <button
            type="button"
            onClick={() => openApply()}
            className="btn-cta btn-cta-volt rounded-md bg-volt px-8 py-4 font-mono text-caption uppercase text-ink hover:bg-volt-hover"
          >
            Начать зарабатывать →
          </button>
        </div>
      </div>
    </section>
  );
}

// Shared card used in both desktop grid (with scroll-anim) and mobile carousel (static)
function CompareCard({
  col,
  rows,
  anim,
}: {
  col: Col;
  rows: Row[];
  anim?: { opacity: MotionValue<number>; scale: MotionValue<number>; filter: MotionValue<string> };
}) {
  const Wrapper = anim ? motion.article : "article";
  const styleProps = anim
    ? { style: { opacity: anim.opacity, scale: anim.scale, filter: anim.filter } }
    : {};

  return (
    <Wrapper
      {...(styleProps as any)}
      className={`relative flex flex-col overflow-hidden rounded-lg border p-5 sm:p-8 md:p-10 ${
        col.accent
          ? "border-ink-2 bg-ink text-paper"
          : "border-[var(--line-strong)] bg-[var(--bg-2)] opacity-80"
      }`}
    >
      <header className="flex items-center justify-between">
        <span className={`font-mono text-caption uppercase ${col.accent ? "text-white/50" : "text-mute"}`}>
          ВАРИАНТ / {col.index}
        </span>
        {col.accent && (
          <span className="rounded-pill bg-volt px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
            наш
          </span>
        )}
      </header>

      <div className="mt-6 md:mt-10">
        <h3 className="font-sans text-h3">{col.title}</h3>
        <p className={`mt-2 font-mono text-caption uppercase ${col.accent ? "text-white/50" : "text-mute"}`}>
          {col.subtitle}
        </p>
      </div>

      <dl className="mt-6 flex flex-col gap-2.5 md:mt-10 md:gap-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex flex-col gap-0.5 border-b pb-2 last:border-0 md:gap-1 md:pb-3 ${
              col.accent ? "border-white/10" : "border-[var(--line)]"
            }`}
          >
            <dt className={`font-mono text-[11px] uppercase tracking-[0.08em] ${col.accent ? "text-white/50" : "text-mute"}`}>
              {row.label}
            </dt>
            <dd
              className={`font-sans text-body ${
                col.accent ? "text-paper" : "text-mute"
              }`}
            >
              {row[col.key as keyof Row]}
            </dd>
          </div>
        ))}
      </dl>
    </Wrapper>
  );
}
