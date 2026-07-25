"use client";

// Секция "Как работает" — Apple-style премиум плавность.
//
// Ключи Apple-look'а:
// 1. Custom easing cubicBezier(0.22, 1, 0.36, 1) — easeOutQuart, очень мягкий tail
// 2. Длинные scroll-диапазоны — анимация тянется через ~45% scroll секции
// 3. Composite эффект: opacity + scale + blur одновременно, не plain translate
// 4. Мягкий translate -40px (не -80), чтобы не было резкого "прыжка"
// 5. Bg-layer со своим долгим fade-out для cross-layer reveal с Bike под ним

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "framer-motion";
import { EASE, SMOOTH_SCROLL } from "./motion-config";

const STEPS = [
  {
    num: "01",
    title: "Оформи заявку",
    desc: "Выбери тариф, загрузи паспорт, подпиши по СМС и привяжи карту. Всё с телефона, никаких визитов до выдачи.",
    time: "~10 мин",
  },
  {
    num: "02",
    title: "Жди подтверждения",
    desc: "Оператор проверяет документы вручную. Когда всё ок — приходит сообщение что можно забирать велик.",
    time: "~15 мин",
  },
  {
    num: "03",
    title: "Забери велик",
    desc: "Приезжай на точку в Санкт‑Петербурге. Инструктаж, передача Mingto U2 Pro — и ты зарабатываешь с первого дня.",
    time: "~15 мин",
  },
];

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);

  // Raw scroll progress оборачиваем в useSpring — это даёт "масляный"
  // Apple-style lag за скроллом (см. components/motion-config.ts).
  const { scrollYProgress: rawProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 10%"],
  });
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // ============================================================
  // Card reveals — composite opacity + scale + blur с easing
  // ============================================================

  // Карточка 1
  const opacity1 = useTransform(
    scrollYProgress,
    [0, 0.15, 0.55, 0.88],
    [0, 1, 1, 0],
    { ease: EASE }
  );
  const scale1 = useTransform(
    scrollYProgress,
    [0, 0.15, 0.55, 0.88],
    [0.94, 1, 1, 0.94],
    { ease: EASE }
  );
  const y1 = useTransform(scrollYProgress, [0.55, 0.88], [0, -40], {
    ease: EASE,
  });
  const blur1 = useTransform(
    scrollYProgress,
    [0, 0.15, 0.55, 0.88],
    [6, 0, 0, 8],
    { ease: EASE }
  );

  // Карточка 2 — с небольшим stagger
  const opacity2 = useTransform(
    scrollYProgress,
    [0.04, 0.19, 0.58, 0.91],
    [0, 1, 1, 0],
    { ease: EASE }
  );
  const scale2 = useTransform(
    scrollYProgress,
    [0.04, 0.19, 0.58, 0.91],
    [0.94, 1, 1, 0.94],
    { ease: EASE }
  );
  const y2 = useTransform(scrollYProgress, [0.58, 0.91], [0, -40], {
    ease: EASE,
  });
  const blur2 = useTransform(
    scrollYProgress,
    [0.04, 0.19, 0.58, 0.91],
    [6, 0, 0, 8],
    { ease: EASE }
  );

  // Карточка 3
  const opacity3 = useTransform(
    scrollYProgress,
    [0.08, 0.23, 0.61, 0.94],
    [0, 1, 1, 0],
    { ease: EASE }
  );
  const scale3 = useTransform(
    scrollYProgress,
    [0.08, 0.23, 0.61, 0.94],
    [0.94, 1, 1, 0.94],
    { ease: EASE }
  );
  const y3 = useTransform(scrollYProgress, [0.61, 0.94], [0, -40], {
    ease: EASE,
  });
  const blur3 = useTransform(
    scrollYProgress,
    [0.08, 0.23, 0.61, 0.94],
    [6, 0, 0, 8],
    { ease: EASE }
  );

  // Header
  const headerOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.52, 0.85],
    [0, 1, 1, 0],
    { ease: EASE }
  );
  const headerY = useTransform(scrollYProgress, [0.52, 0.85], [0, -30], {
    ease: EASE,
  });
  const headerBlur = useTransform(
    scrollYProgress,
    [0, 0.12, 0.52, 0.85],
    [4, 0, 0, 6],
    { ease: EASE }
  );

  // Секция НЕ fade'ится — просто уезжает вверх при скролле.
  // Bike (z-0, sticky top-0) остаётся на месте и занимает экран.

  // Фильтры через template
  const blurFilter1 = useMotionTemplate`blur(${blur1}px)`;
  const blurFilter2 = useMotionTemplate`blur(${blur2}px)`;
  const blurFilter3 = useMotionTemplate`blur(${blur3}px)`;
  const headerBlurFilter = useMotionTemplate`blur(${headerBlur}px)`;

  const cards: {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
    y: MotionValue<number>;
    filter: MotionValue<string>;
  }[] = [
    { opacity: opacity1, scale: scale1, y: y1, filter: blurFilter1 },
    { opacity: opacity2, scale: scale2, y: y2, filter: blurFilter2 },
    { opacity: opacity3, scale: scale3, y: y3, filter: blurFilter3 },
  ];

  // HowTo Schema — Google показывает пошаговую инструкцию в SERP
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Как арендовать электровелосипед Mingto U2 Pro в Санкт-Петербурге",
    description: "Оформи заявку онлайн, пройди верификацию и забери велик на точке выдачи — всего за 30 минут.",
    totalTime: "PT40M",
    step: STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.desc,
    })),
  };

  return (
    <section
      ref={ref}
      data-theme="light"
      id="how"
      className="relative z-10 overflow-hidden text-[var(--text)]"
    >
      {/* HowTo JSON-LD для Google rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* Background layer — квадратный, без скруглений, без fade */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[var(--bg)]"
      />

      <div className="relative mx-auto max-w-content px-gutter py-section-y">
        <motion.div
          style={{
            opacity: headerOpacity,
            y: headerY,
            filter: headerBlurFilter,
          }}
          className="flex items-baseline justify-between border-b border-[var(--line)] pb-4"
        >
          <div className="flex flex-col gap-2">
            <span className="font-mono text-caption uppercase text-mute">
              01 / КАК РАБОТАЕТ
            </span>
            <h2 className="font-sans text-h2">Три шага до велика</h2>
          </div>
          <span className="hidden font-mono text-caption uppercase text-mute md:inline">
            ~30 минут от клика до выдачи
          </span>
        </motion.div>

        {/* DESKTOP: 3-column grid с scroll-driven анимациями */}
        <div className="mt-12 hidden gap-6 md:grid md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              style={{
                opacity: cards[i].opacity,
                scale: cards[i].scale,
                y: cards[i].y,
                filter: cards[i].filter,
              }}
              className="flex min-h-[320px] flex-col justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-8"
            >
              <div className="flex items-start justify-between">
                <span className="font-sans text-display-2 tnum leading-none">
                  {step.num}
                </span>
                <span className="rounded-pill border border-[var(--line-strong)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
                  {step.time}
                </span>
              </div>
              <div>
                <h3 className="font-sans text-h3">{step.title}</h3>
                <p className="mt-3 max-w-[32ch] font-sans text-body leading-[1.55] text-mute">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MOBILE: snap-carousel с рабочими dots */}
        <MobileStepsCarousel />
      </div>
    </section>
  );
}

// ============================================================
// Mobile snap-carousel с рабочими scroll-tracking dots
// ============================================================

function MobileStepsCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

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

  return (
    <div className="mt-6 md:hidden">
      <div
        ref={carouselRef}
        className="carousel-scrollbar-hidden flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-gutter pb-2"
      >
        {STEPS.map((step) => (
          <div key={step.num} className="mr-4 w-[calc(100vw-48px)] shrink-0 snap-start last:mr-0">
            <div className="flex min-h-[200px] flex-col justify-between overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
              <div className="flex items-start justify-between">
                <span className="font-sans text-display-2 tnum leading-none">
                  {step.num}
                </span>
                <span className="rounded-pill border border-[var(--line-strong)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
                  {step.time}
                </span>
              </div>
              <div>
                <h3 className="font-sans text-h3">{step.title}</h3>
                <p className="mt-3 font-sans text-body leading-[1.55] text-mute">
                  {step.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots — обновляются при свайпе */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.num}
            type="button"
            aria-label={`Шаг ${s.num}`}
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
                i === activeIdx
                  ? "w-6 bg-[var(--text)]"
                  : "w-1.5 bg-[var(--line-strong)]"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
