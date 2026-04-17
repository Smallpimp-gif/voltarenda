"use client";

// Секция "Тарифы" — шлифованная версия Этапа 4.
// - Desktop 2x2 grid (как и было)
// - Mobile snap-carousel с accent-карточкой "Неделя" в фокусе при первом показе
// - Pagination dots под carousel
// - Scroll-reveal stagger карточек через useInView

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { EASE, SMOOTH_SCROLL } from "./motion-config";
import { TariffCard } from "./tariff-card";
import { Reveal } from "./reveal";
import { useApply, type TariffKey } from "./apply";


// Value-спек вместо бюрократического: что курьер реально получает
// за свои деньги. "Залог/списание" перенесено в трастовую зону и
// footer оферты.
const SPECS = [
  { label: "ВЕЛОСИПЕД", value: "ВОЛЬТ U2" },
  { label: "ЗАПАС ХОДА", value: "~120 КМ" },
  { label: "АККУМУЛЯТОРЫ", value: "2 АКБ · 60+30 АЧ" },
  { label: "ЗАРЯДКА + ЗАМОК", value: "В КОМПЛЕКТЕ" },
  { label: "ТО И МЕХАНИК", value: "50% НА НАС" },
];

type Tariff = {
  key: TariffKey;
  index: string;
  name: string;
  price: string;
  period: string;
  accent?: boolean;
};

const TARIFFS: Tariff[] = [
  { key: "three-day", index: "01", name: "3 дня", price: "3500", period: "3 ДНЯ" },
  { key: "week", index: "02", name: "Неделя", price: "5500", period: "7 ДНЕЙ", accent: true },
  { key: "month", index: "03", name: "Месяц", price: "19000", period: "30 ДНЕЙ" },
  { key: "buyout", index: "04", name: "Выкуп", price: "6500", period: "НЕД × 26" },
];

export function TariffsSection() {
  const { open } = useApply();
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(1); // Неделя в фокусе

  // Apple-style scroll-driven reveal через smoothed progress
  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 10%"],
  });
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // Header
  const headerOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [0, 1, 1],
    { ease: EASE }
  );
  const headerScale = useTransform(
    scrollYProgress,
    [0, 0.4],
    [0.95, 1],
    { ease: EASE }
  );
  const headerBlurVal = useTransform(
    scrollYProgress,
    [0, 0.4],
    [6, 0],
    { ease: EASE }
  );
  const headerBlur = useMotionTemplate`blur(${headerBlurVal}px)`;

  // Карточки теперь анимируются через <Reveal> с индексным delay —
  // устаревшие ручные useScroll-transforms удалены.

  // Начальный scroll на accent-карточку (Неделя, индекс 1) сразу на mount.
  // RAF + короткий timeout чтобы layout успел посчитать offsetLeft.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const raf = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        const el = carouselRef.current;
        if (!el) return;
        const accent = el.children[1] as HTMLElement | undefined;
        if (accent) {
          el.scrollLeft = accent.offsetLeft - 16;
        }
      }, 30);
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  // Отслеживание активной карточки по scrollLeft
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
    <section
      ref={sectionRef}
      data-theme="light"
      id="tariffs"
      className="relative z-10 -mt-[100vh] overflow-hidden text-[var(--text)]"
    >
      {/* Solid bg layer — всегда непрозрачный, чтобы не просвечивало
          содержимое Bike-секции под -mt-[100vh] overlap зоной. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[var(--bg)]"
      />

      <div className="relative mx-auto max-w-content px-gutter py-section-y">
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
              03 / ТАРИФЫ
            </span>
            <h2 className="font-sans text-h2">Выбери период</h2>
          </div>
          <span className="hidden font-mono text-caption uppercase text-mute md:inline">
            залог 5 000 ₽ возвратный · автопродление по тарифу
          </span>
        </motion.div>

        {/* Mobile-only: те же условия видны до карусели, чтобы курьер
            не узнавал о залоге и автопродлении впервые в модалке заявки. */}
        <div className="mt-4 pr-16 font-mono text-caption uppercase text-mute md:hidden">
          залог 5 000 ₽ возвратный · автопродление по тарифу
        </div>

        {/* DESKTOP: 2x2 grid — короткий stagger между карточками (60ms друг
            за другом). Карточка целиком проявляется как единое целое, без
            внутреннего замедляющего stagger. */}
        <div className="mt-12 hidden grid-cols-2 gap-6 md:grid">
          {TARIFFS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <TariffCard
                index={t.index}
                name={t.name}
                price={t.price}
                period={t.period}
                specs={SPECS}
                accent={t.accent}
                onApply={() => open(t.key)}
              />
            </Reveal>
          ))}
        </div>

        {/* MOBILE: snap-carousel — без scroll-reveal чтобы initial scrollLeft
            не терялся из-за перерисовки от framer-motion transform. Карусель
            статична, accent-карточка в фокусе сразу при mount. */}
        <div className="mt-8 overflow-hidden pb-6 md:mt-12 md:pb-0 md:hidden">
          <div
            ref={carouselRef}
            className="carousel-scrollbar-hidden flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-gutter pb-2"
          >
            {TARIFFS.map((t) => (
              <div
                key={t.name}
                className="mr-4 w-[calc(100vw-48px)] shrink-0 snap-start last:mr-0"
              >
                <TariffCard
                  index={t.index}
                  name={t.name}
                  price={t.price}
                  period={t.period}
                  specs={SPECS}
                  accent={t.accent}
                  onApply={() => open(t.key)}
                />
              </div>
            ))}
          </div>

          {/* Pagination dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {TARIFFS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                aria-label={`Показать тариф ${t.name}`}
                onClick={() => {
                  const el = carouselRef.current;
                  if (!el) return;
                  const card = el.children[i] as HTMLElement | undefined;
                  if (card) {
                    el.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
                  }
                }}
                className="flex h-11 items-center justify-center px-2"
              >
                <span
                  className={`h-1.5 rounded-pill transition-all duration-base ease-out-soft ${
                    i === activeIdx
                      ? "w-8 bg-[var(--text)]"
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
