"use client";

// Hero-секция лендинга — финальная версия Этапа 3.
// Фичи: параллакс фото + scroll-indicator + video-ready + zoom-out на загрузке.

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useApply } from "./apply";
import { APPLE_EASE } from "./motion-config";

const EASE = APPLE_EASE;

// ============================================================
// Video background — активируется одной строчкой когда появится файл.
// Положи mp4 (или webm) в public/ и укажи путь:
//   const HERO_VIDEO: string | null = "/hero.mp4";
// Остальной код автоматически переключится с <Image /> на <video>.
// ============================================================
const HERO_VIDEO: string | null = null;

// Varianty для staggered появления основных блоков
// Слоуны намеренно медленные чтобы анимации были заметны на load
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.22,
      delayChildren: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

export function Hero() {
  const { open, hasPersisted, persistedProgress } = useApply();
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  // Параллакс фона — движется на 20% от скролла (отключается при reduced-motion)
  const imageY = useTransform(scrollY, [0, 1000], prefersReduced ? ["0%", "0%"] : ["0%", "20%"]);

  return (
    <section
      data-theme="dark"
      id="hero"
      className="relative z-20 min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]"
    >
      {/* Фон — параллакс + zoom-out при загрузке. Video если HERO_VIDEO задан.
          ВАЖНО: НЕ ставить opacity:0 в initial — Lighthouse не считает
          элемент LCP-кандидатом пока он opacity 0. Hero image priority +
          opacity:0 → LCP=undefined → Performance score = 0. Анимируем
          только scale (zoom-out), картинка сразу opacity:1 = валидный LCP. */}
      <motion.div
        aria-hidden
        style={{ y: imageY }}
        initial={prefersReduced ? {} : { scale: 1.15 }}
        animate={prefersReduced ? {} : { scale: 1 }}
        transition={{ duration: prefersReduced ? 0 : 1.8, ease: EASE }}
        className="absolute inset-0"
      >
        {HERO_VIDEO ? (
          <video
            src={HERO_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <Image
            src="/rider.webp"
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover object-center"
          />
        )}
      </motion.div>

      {/* Базовый диагональный градиент — лёгкая «инженерная» затемняшка.
          Сам по себе слаб — текст в нижней половине просвечивал картинку
          сквозь буквы. Поэтому ниже добавлен прицельный bottom-scrim. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-tr from-black via-black/75 to-black/30"
      />
      {/* Bottom-scrim — гарантирует чёрный фон под textblock'ом
          (subtitle, CTA, trust). Картинку закрывает только в нижней
          половине, верхняя половина с фото остаётся читаемой. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/80 to-transparent"
      />

      {/* Контент — staggered fade-in снизу-вверх */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 mx-auto flex min-h-screen max-w-content flex-col px-gutter pb-12 pt-20 sm:pb-32"
      >
        {/* Spacer — толкает весь контент вниз, чтобы фото было видно больше */}
        <div className="flex-1" />

        {/* H1 — единый fade-in как остальные элементы.
            Eyebrow «00 / ВОЛЬТАРЕНДА / СПБ» был дублем sticky-header'а
            (то же имя бренда сверху), снят. */}
        <motion.h1
          variants={itemVariants}
          className="font-sans text-display-1"
        >
          Бери<br />и зарабатывай
        </motion.h1>

        {/* Subtitle — один факт-крючок про главное УТП (2 АКБ, ~120 км).
            Цена/город/время — спущены в trust-строки ниже, чтобы здесь
            не нагромождать 4 факта в 2 строки. */}
        <motion.p
          variants={itemVariants}
          className="mt-8 max-w-[44ch] font-sans text-body-lg text-mute"
        >
          Два АКБ, ~120 км на смену — без тревоги о зарядке.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 sm:mt-10"
        >
          <button
            type="button"
            onClick={() => {
              try { (window as any).ym?.(108583356, "reachGoal", "CTA_CLICK", { source: "hero" }); } catch {}
              hasPersisted ? open() : open("week");
            }}
            className="btn-cta btn-cta-volt rounded-md bg-volt px-8 py-5 font-mono text-[14px] uppercase tracking-[0.08em] text-ink hover:bg-volt-hover sm:px-10 sm:py-6 sm:text-[16px]"
          >
            {hasPersisted
              ? `Продолжить заявку · ${persistedProgress}/4 →`
              : "Начать зарабатывать →"}
          </button>
          {/* «Тарифы от 3500 ₽» снят: дублировал «от 633 ₽/день» из
              subtitle и при этом давал ДРУГУЮ цену (3-дневный тариф vs
              месячный за день). Цена-конфликт на одном экране. */}
        </motion.div>

        {/* Обе trust-строки сняты — Stripe-style: H1, один факт-крючок,
            CTA. Цена живёт в Tariffs (секция 03), социальные метрики —
            в трастовой полосе TrustBar (секция 08) и в калькуляторе.
            Hero отвечает на «что и зачем», подробности — скроллом. */}
      </motion.div>

    </section>
  );
}
