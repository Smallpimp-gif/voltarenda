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
      {/* Фон — параллакс по скроллу (y), без entry-анимации.
          ВАЖНО: НЕ навешивать на priority Image никаких mount-transition'ов
          (opacity, scale, blur). Lighthouse / web-vitals API исключают
          элементы с активной transform/opacity transition из LCP-кандидатов
          пока анимация не завершилась — это давало LCP=undefined и
          Performance=0. Параллакс через scroll-driven `y` это не ломает,
          т.к. transform начинается только после первого scroll. */}
      <motion.div
        aria-hidden
        style={{ y: imageY }}
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

      {/* Верхний scrim — лёгкий, чтобы байк оставался виден как продукт.
          Раньше тут был диагональный градиент `from-black via-black/75
          to-black/30`, убивавший фото. Research по яндекс.драйв / юрент /
          whoosh показал: product-forward hero держит скрим минимальным. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"
      />
      {/* Нижний scrim — плотный снизу, гарантирует читаемость eyebrow /
          H1 / subtitle / CTA / trust-row поверх любого кадра. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black via-black/85 to-transparent"
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

        {/* Eyebrow — гео + формат услуги. Даёт контекст до H1 (что это
            за сайт / где / для кого), экономит когнитивную нагрузку
            первого взгляда. */}
        <motion.span
          variants={itemVariants}
          className="font-mono text-caption uppercase tracking-[0.08em] text-mute"
        >
          Аренда · Санкт-Петербург · Выдача в день обращения
        </motion.span>

        {/* H1 — SEO-оптимизированное позиционирование. «Электровелосипед»
            (legal-термин, не «электробайк» — важно для search) + модель
            U2 + формат услуги + гео. Размер уменьшен ~20% от text-display-1
            (clamp 36–72px вместо 44–88px) — 5 слов длинновато для пиковых
            размеров display-1, начинает доминировать над сценой. */}
        <motion.h1
          variants={itemVariants}
          className="mt-4 font-sans font-bold leading-[0.95] tracking-[-0.03em] text-[clamp(36px,5vw,72px)]"
        >
          Электровелосипед U2<br />в аренду в&nbsp;СПб
        </motion.h1>

        {/* Subtitle — полная спецификация + ценовой якорь. «от 633 ₽/день»
            выделен volt-цветом (brand accent), чтобы цена считывалась
            сразу, до того как пользователь прочитает всё предложение. */}
        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-[52ch] font-sans text-body-lg text-mute"
        >
          Топовая модель для курьеров. 65 км/ч, 2 аккумулятора LiFePO4, до 120
          км на смену.{" "}
          <span className="font-semibold text-volt">От 633 ₽/день</span> — ниже,
          чем у других прокатов СПб.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-10"
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
          {/* Secondary — текстовый линк на калькулятор. Путь для «ещё
              думаю»: даёт быстро прикинуть заработок, не открывая форму. */}
          <a
            href="#calc"
            onClick={() => {
              try { (window as any).ym?.(108583356, "reachGoal", "HERO_CALC_CLICK"); } catch {}
            }}
            className="inline-flex min-h-[44px] items-center px-2 py-3 font-mono text-[14px] uppercase tracking-[0.08em] text-mute underline-offset-4 hover:text-[var(--text)] hover:underline sm:text-[16px]"
          >
            Рассчитать заработок ↓
          </a>
        </motion.div>

        {/* Trust-row — 4 коротких факта под CTA. Паттерн ситидрайв/юрент:
            гео + комплектация + канал выдачи + поддержка. «Техподдержка
            24/7» — сигнал надёжности для курьера, который выходит на
            смену в 6 утра и не может ждать рабочих часов. */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.08em] text-mute sm:gap-x-6"
        >
          <span>Парголово</span>
          <span aria-hidden className="text-mute/40">·</span>
          <span>2 АКБ в комплекте</span>
          <span aria-hidden className="text-mute/40">·</span>
          <span>Выдача за ~2 часа</span>
          <span aria-hidden className="text-mute/40">·</span>
          <span>Техподдержка 24/7</span>
        </motion.div>
      </motion.div>

    </section>
  );
}
