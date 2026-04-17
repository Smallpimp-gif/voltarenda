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
      {/* Фон — параллакс + zoom-out при загрузке. Video если HERO_VIDEO задан. */}
      <motion.div
        aria-hidden
        style={{ y: imageY }}
        initial={prefersReduced ? { opacity: 0 } : { scale: 1.15, opacity: 0 }}
        animate={prefersReduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={{ duration: prefersReduced ? 0.4 : 1.8, ease: EASE }}
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

      {/* Dark gradient overlay для читаемости текста */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-tr from-black via-black/75 to-black/30"
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

        <motion.span
          variants={itemVariants}
          className="font-mono text-caption uppercase text-mute"
        >
          00 / ВОЛЬТАРЕНДА / СПБ
        </motion.span>

        {/* H1 — единый fade-in как остальные элементы */}
        <motion.h1
          variants={itemVariants}
          className="mt-6 font-sans text-display-1"
        >
          Бери<br />и зарабатывай
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-8 max-w-[52ch] font-sans text-body-lg text-mute"
        >
          Для курьеров Петербурга. Выдача за 30 минут.
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
          <a
            href="#tariffs"
            className="font-mono text-caption uppercase text-mute underline decoration-white/20 underline-offset-4 transition-colors hover:text-[var(--text)] hover:decoration-volt"
          >
            Тарифы от 3500 ₽
          </a>
        </motion.div>

        {/* Якорная строка — снимает страх «сколько ещё сверху» */}
        <motion.p
          variants={itemVariants}
          className="mt-4 font-mono text-caption uppercase text-mute"
        >
          Залог 5 000 ₽ · возвращаем при сдаче
        </motion.p>

        {/* Live-trader — единственный источник метрик в hero.
            Сводит окупаемость + число курьеров + дату данных в одну
            trust-строку. Цифра дохода живёт в калькуляторе ниже — так
            пользователь считает свою сумму, а не видит рекламное обещание. */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1"
        >
          <span aria-hidden className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-volt opacity-60" />
            <span className="relative inline-block h-2 w-2 rounded-full bg-volt" />
          </span>
          <span className="font-sans text-body text-[var(--text)]">
            47 курьеров уже работают
            <span className="hidden sm:inline"> · окупаемость 2–3 дня</span>
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
            данные за март 2026
          </span>
        </motion.div>
      </motion.div>

    </section>
  );
}
