"use client";

// Секция "Пункт выдачи" — Apple-style scroll-driven reveal.
// Одна точка выдачи в СПб — инфо-колонка слева + карта справа.

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import { EASE, SMOOTH_SCROLL } from "./motion-config";

const INFO: [string, string][] = [
  ["АДРЕС", "СПб, Парголово, ул. Шишкина, 297"],
  ["ЧАСЫ РАБОТЫ", "пн–вс · 9:00 – 21:00"],
  ["ТЕЛЕФОН", "+7 (901) 300-03-19"],
  ["С СОБОЙ", "паспорт, селфи, банковская карта"],
];

export function LocationSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 10%"],
  });
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // Header
  const headerOpacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 1, 1], { ease: EASE });
  const headerScale = useTransform(scrollYProgress, [0, 0.35], [0.95, 1], { ease: EASE });
  const headerBlurVal = useTransform(scrollYProgress, [0, 0.35], [6, 0], { ease: EASE });
  const headerBlur = useMotionTemplate`blur(${headerBlurVal}px)`;

  // Info-строки — inline stagger hooks (Rules of Hooks)
  const op1 = useTransform(scrollYProgress, [0.15, 0.5], [0, 1], { ease: EASE });
  const y1 = useTransform(scrollYProgress, [0.15, 0.5], [20, 0], { ease: EASE });
  const bl1 = useTransform(scrollYProgress, [0.15, 0.5], [6, 0], { ease: EASE });
  const fil1 = useMotionTemplate`blur(${bl1}px)`;

  const op2 = useTransform(scrollYProgress, [0.18, 0.53], [0, 1], { ease: EASE });
  const y2 = useTransform(scrollYProgress, [0.18, 0.53], [20, 0], { ease: EASE });
  const bl2 = useTransform(scrollYProgress, [0.18, 0.53], [6, 0], { ease: EASE });
  const fil2 = useMotionTemplate`blur(${bl2}px)`;

  const op3 = useTransform(scrollYProgress, [0.21, 0.56], [0, 1], { ease: EASE });
  const y3 = useTransform(scrollYProgress, [0.21, 0.56], [20, 0], { ease: EASE });
  const bl3 = useTransform(scrollYProgress, [0.21, 0.56], [6, 0], { ease: EASE });
  const fil3 = useMotionTemplate`blur(${bl3}px)`;

  const op4 = useTransform(scrollYProgress, [0.24, 0.59], [0, 1], { ease: EASE });
  const y4 = useTransform(scrollYProgress, [0.24, 0.59], [20, 0], { ease: EASE });
  const bl4 = useTransform(scrollYProgress, [0.24, 0.59], [6, 0], { ease: EASE });
  const fil4 = useMotionTemplate`blur(${bl4}px)`;

  const rows: {
    opacity: MotionValue<number>;
    y: MotionValue<number>;
    filter: MotionValue<string>;
  }[] = [
    { opacity: op1, y: y1, filter: fil1 },
    { opacity: op2, y: y2, filter: fil2 },
    { opacity: op3, y: y3, filter: fil3 },
    { opacity: op4, y: y4, filter: fil4 },
  ];

  // Map card — композитная анимация с чуть большим stagger
  const mapOpacity = useTransform(scrollYProgress, [0.2, 0.6], [0, 1], { ease: EASE });
  const mapScale = useTransform(scrollYProgress, [0.2, 0.6], [0.94, 1], { ease: EASE });
  const mapBlurVal = useTransform(scrollYProgress, [0.2, 0.6], [8, 0], { ease: EASE });
  const mapBlur = useMotionTemplate`blur(${mapBlurVal}px)`;

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      id="location"
      className="relative bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="mx-auto max-w-content px-gutter py-section-y">
        <motion.div
          style={{ opacity: headerOpacity, scale: headerScale, filter: headerBlur }}
          className="border-b border-[var(--line)] pb-4"
        >
          <span className="font-mono text-caption uppercase text-mute">
            06 / ПУНКТ ВЫДАЧИ
          </span>
          <h2 className="mt-2 font-sans text-h2">Забирай в Парголове</h2>
          <p className="mt-4 max-w-[52ch] font-sans text-body text-mute">
            Посёлок Парголово, рядом с метро Парнас (~15 минут пешком или 1 остановка на автобусе). Приезжай, забирай велик, инструктаж — и в путь. Всё за 15 минут.
          </p>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          {/* Левая — info */}
          <div className="flex flex-col gap-8">
            {INFO.map(([k, v], i) => (
              <motion.div
                key={k}
                style={{
                  opacity: rows[i].opacity,
                  y: rows[i].y,
                  filter: rows[i].filter,
                }}
                className="border-b border-[var(--line)] pb-6 last:border-0"
              >
                <div className="font-mono text-caption uppercase text-mute">{k}</div>
                <div className="mt-2 font-sans text-body-lg">
                  {k === "ТЕЛЕФОН" ? (
                    <a href={`tel:${v.replace(/[^+\d]/g, "")}`} className="transition-colors hover:text-volt">
                      {v}
                    </a>
                  ) : v}
                </div>
              </motion.div>
            ))}

          </div>

          {/* Правая — Яндекс.Карты embed.
              Пока точка в центре СПб (Невский, 1); реальный адрес заменим позже. */}
          <motion.div
            style={{
              opacity: mapOpacity,
              scale: mapScale,
              filter: mapBlur,
              aspectRatio: "4 / 3",
            }}
            className="relative overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-2)]"
          >
            {/* Shimmer-скелетон — виден пока iframe грузится */}
            <div className="skeleton-shimmer absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-caption uppercase text-mute">Загрузка карты…</span>
            </div>
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=30.311619%2C60.081695&z=16&mode=search&text=%D0%A1%D0%B0%D0%BD%D0%BA%D1%82-%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3%2C%20%D0%9F%D0%B0%D1%80%D0%B3%D0%BE%D0%BB%D0%BE%D0%B2%D0%BE%2C%20%D1%83%D0%BB.%20%D0%A8%D0%B8%D1%88%D0%BA%D0%B8%D0%BD%D0%B0%2C%20297&pt=30.311619%2C60.081695"
              loading="lazy"
              title="Пункт выдачи Вольтаренды на карте"
              className="absolute inset-0 z-10 h-full w-full border-0"
              allowFullScreen
            />
          </motion.div>

          {/* CTA под картой — на всю ширину grid */}
          <a
            href="https://yandex.ru/maps/?rtext=~60.081695,30.311619&rtt=auto"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta btn-cta-volt col-span-1 inline-flex items-center justify-between rounded-md bg-volt px-5 py-4 font-mono text-caption uppercase text-ink hover:bg-volt-hover lg:col-span-2"
          >
            <span>Построить маршрут</span>
            <span className="font-sans text-base">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
