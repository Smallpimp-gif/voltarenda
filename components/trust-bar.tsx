"use client";

// Trust bar — 4 технических "значка" про безопасность и гарантии.
// Не иконки, а mono-caps текст в тех-паспортной стилистике. Ставится
// между FAQ и FinalCTA/Footer для последнего психологического толчка.

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

// Типографика (правила русского набора, см. Мильчин / Ководство):
// — неразрывные пробелы (\u00A0) между цифрой и единицей («5\u00A0000 ₽»,
//   «2\u00A0недели», «3\u00A0рабочих дня», «152-ФЗ»);
// — nbsp между односложными предлогами и следующим словом («по\u00A0152-ФЗ»,
//   «на\u00A0карту», «за\u00A03»), чтобы не висели в конце строки;
// — title разделён на 2 строки явно (\n + whitespace-pre-line) — все четыре
//   плитки получают одинаковый визуальный ритм 2×строки, включая
//   «ЗАЛОГ / ВЕРНЁМ», которая на десктопе съезжала в одну.
const ITEMS: { index: string; title: string; desc: string }[] = [
  {
    index: "01",
    title: "ДАННЫЕ\nВ\u00A0БЕЗОПАСНОСТИ",
    desc: "Защитим твои данные по\u00A0152-ФЗ, никому не\u00A0передадим",
  },
  {
    index: "02",
    title: "ПЛАТИШЬ\nБЕЗОПАСНО",
    desc: "SSL + 3D\u00A0Secure через CloudPayments",
  },
  {
    index: "03",
    title: "ВЕЛИК\nИСПРАВЕН",
    desc: "Механик проверяет каждые 2\u00A0недели перед передачей",
  },
  {
    index: "04",
    title: "ЗАЛОГ\nВЕРНЁМ",
    desc: "5\u00A0000 ₽ обратно на\u00A0карту за\n3\u00A0рабочих дня",
  },
];

export function TrustBar() {
  const sectionRef = useRef<HTMLElement>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ["start 90%", "start 20%"],
  });
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // Scroll tracking для dots
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
        if (dist < closestDist) { closest = i; closestDist = dist; }
      });
      setActiveIdx(closest);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const headerOp = useTransform(scrollYProgress, [0, 0.3], [0, 1], { ease: EASE });
  const headerY = useTransform(scrollYProgress, [0, 0.3], [16, 0], { ease: EASE });

  // 4 блока с крохотным stagger
  const op1 = useTransform(scrollYProgress, [0.1, 0.4], [0, 1], { ease: EASE });
  const y1 = useTransform(scrollYProgress, [0.1, 0.4], [20, 0], { ease: EASE });
  const bl1 = useTransform(scrollYProgress, [0.1, 0.4], [4, 0], { ease: EASE });
  const fil1 = useMotionTemplate`blur(${bl1}px)`;

  const op2 = useTransform(scrollYProgress, [0.14, 0.44], [0, 1], { ease: EASE });
  const y2 = useTransform(scrollYProgress, [0.14, 0.44], [20, 0], { ease: EASE });
  const bl2 = useTransform(scrollYProgress, [0.14, 0.44], [4, 0], { ease: EASE });
  const fil2 = useMotionTemplate`blur(${bl2}px)`;

  const op3 = useTransform(scrollYProgress, [0.18, 0.48], [0, 1], { ease: EASE });
  const y3 = useTransform(scrollYProgress, [0.18, 0.48], [20, 0], { ease: EASE });
  const bl3 = useTransform(scrollYProgress, [0.18, 0.48], [4, 0], { ease: EASE });
  const fil3 = useMotionTemplate`blur(${bl3}px)`;

  const op4 = useTransform(scrollYProgress, [0.22, 0.52], [0, 1], { ease: EASE });
  const y4 = useTransform(scrollYProgress, [0.22, 0.52], [20, 0], { ease: EASE });
  const bl4 = useTransform(scrollYProgress, [0.22, 0.52], [4, 0], { ease: EASE });
  const fil4 = useMotionTemplate`blur(${bl4}px)`;

  const anims: {
    opacity: MotionValue<number>;
    y: MotionValue<number>;
    filter: MotionValue<string>;
  }[] = [
    { opacity: op1, y: y1, filter: fil1 },
    { opacity: op2, y: y2, filter: fil2 },
    { opacity: op3, y: y3, filter: fil3 },
    { opacity: op4, y: y4, filter: fil4 },
  ];

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      id="trust"
      className="relative bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="mx-auto max-w-content px-gutter py-12 md:py-20">
        <motion.div
          style={{ opacity: headerOp, y: headerY }}
          className="border-b border-[var(--line)] pb-4"
        >
          <span className="font-mono text-caption uppercase text-mute">
            08 / ГАРАНТИИ
          </span>
        </motion.div>

        {/* DESKTOP: 2x2 / 4-col grid */}
        <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((it, i) => (
            <motion.div
              key={it.index}
              style={{
                opacity: anims[i].opacity,
                y: anims[i].y,
                filter: anims[i].filter,
              }}
              className="flex min-h-[240px] flex-col justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6"
            >
              <span className="font-sans text-display-2 tnum leading-none">
                {it.index}
              </span>
              <div>
                <h3 className="whitespace-pre-line font-sans text-h3">
                  {it.title}
                </h3>
                <p className="mt-3 whitespace-pre-line font-sans text-body leading-[1.55] text-mute">
                  {it.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MOBILE: snap-carousel — layout как в "Три шага до велика" */}
        <div className="mt-6 sm:hidden">
          <div
            ref={carouselRef}
            className="carousel-scrollbar-hidden flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-gutter pb-2"
          >
            {ITEMS.map((it, i) => (
              <motion.div
                key={it.index}
                style={{
                  opacity: anims[i].opacity,
                  y: anims[i].y,
                  filter: anims[i].filter,
                }}
                className="mr-4 w-[calc(100vw-48px)] shrink-0 snap-start last:mr-0"
              >
                <div className="flex min-h-[200px] flex-col justify-between overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
                  <div className="flex items-start justify-between">
                    <span className="font-sans text-display-2 tnum leading-none">
                      {it.index}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-sans text-h3">{it.title}</h3>
                    <p className="mt-3 font-sans text-body leading-[1.55] text-mute">
                      {it.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Dots */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {ITEMS.map((it, i) => (
              <button
                key={it.index}
                type="button"
                aria-label={`Показать ${it.title}`}
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
      </div>
    </section>
  );
}
