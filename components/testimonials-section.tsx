"use client";

// Секция «Говорят курьеры» — социальный пруф от реальных арендаторов.
// Встаёт между compare-section (где мы доказали выгоду цифрами) и
// location-section (где юзер уже готов ехать) — момент максимального
// сомнения «а не врут ли они?» лечится голосом живого человека.
//
// ⚠️ ДАННЫЕ — PLACEHOLDER.
// Три цитаты ниже сгенерированы как образец формата. Перед релизом
// заменить на реальные истории арендаторов. Формат — короткая цитата,
// имя + краткое описание (сервис + срок), по желанию аватарка.
// Если реальных цитат нет — временно закомментировать секцию в page.tsx
// (лучше пусто, чем подделка).

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { EASE, SMOOTH_SCROLL } from "./motion-config";

type Testimonial = {
  id: string;
  quote: string;
  name: string;
  meta: string; // сервис · срок на байке
};

// PLACEHOLDER — заменить на реальные отзывы ↓
const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "До Вольтаренды арендовал у ребят за 800/день — батарея на 40 км, после обеда плёлся на самокате. Тут 120 км и две батареи. За ту же смену стал делать на треть больше заказов.",
    name: "Максим",
    meta: "Яндекс.Еда · 8 месяцев",
  },
  {
    id: "t2",
    quote:
      "Брал сначала на 3 дня попробовать — через неделю переключился на месячный тариф. Если что-то ломается, ребята чинят без вопросов, залог ни разу не удерживали.",
    name: "Алексей",
    meta: "Самокат · 5 месяцев",
  },
  {
    id: "t3",
    quote:
      "Я не из Питера, мигрант. Документы приняли, всё оформили за 15 минут на точке. Работаю 6 дней, на 7-й катаюсь по городу — велик приличный, не стыдно.",
    name: "Игорь",
    meta: "Купер · 3 месяца",
  },
];

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Scroll-tracking для dots на мобилке
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
    offset: ["start 85%", "start 20%"],
  });
  const progress = useSpring(rawProgress, SMOOTH_SCROLL);

  const headerOpacity = useTransform(progress, [0, 0.4], [0, 1], { ease: EASE });
  const headerScale = useTransform(progress, [0, 0.4], [0.97, 1], { ease: EASE });
  const headerBlurVal = useTransform(progress, [0, 0.4], [4, 0], { ease: EASE });
  const headerBlur = useMotionTemplate`blur(${headerBlurVal}px)`;

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      id="testimonials"
      className="relative overflow-hidden bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="mx-auto max-w-content px-gutter py-section-y">
        <motion.div
          style={{ opacity: headerOpacity, scale: headerScale, filter: headerBlur }}
          className="flex items-baseline justify-between border-b border-[var(--line)] pb-4"
        >
          <div className="flex flex-col gap-2">
            <span className="font-mono text-caption uppercase text-mute">
              05.5 / ОТЗЫВЫ
            </span>
            <h2 className="font-sans text-h2">Говорят курьеры</h2>
          </div>
          <span className="hidden max-w-[32ch] text-right font-mono text-caption uppercase text-mute md:inline">
            реальные арендаторы
          </span>
        </motion.div>

        {/* DESKTOP — 3-column grid */}
        <div className="mt-12 hidden gap-6 md:grid md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>

        {/* MOBILE — snap carousel */}
        <div className="mt-8 md:hidden">
          <div
            ref={carouselRef}
            className="carousel-scrollbar-hidden flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-gutter pb-2"
          >
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.id}
                className="mr-4 w-[calc(100vw-48px)] shrink-0 snap-start last:mr-0"
              >
                <TestimonialCard testimonial={t} index={i} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Показать отзыв ${t.name}`}
                onClick={() => {
                  const el = carouselRef.current;
                  if (!el) return;
                  const card = el.children[i] as HTMLElement | undefined;
                  if (card)
                    el.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
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
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        delay: 0.1 + index * 0.12,
        duration: 0.6,
        ease: EASE,
      }}
      className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-8"
    >
      {/* Раньше тут была volt-SVG-кавычка как brand-accent. Снята —
          юзер счёл её визуальным мусором, цитата читается и без. */}
      <p className="font-sans text-body-lg leading-[1.55] text-[var(--text)]">
        {testimonial.quote}
      </p>

      <div className="mt-auto pt-8">
        <div className="font-sans text-h3">{testimonial.name}</div>
        <div className="mt-1 font-mono text-caption uppercase text-mute">
          {testimonial.meta}
        </div>
      </div>
    </motion.article>
  );
}
