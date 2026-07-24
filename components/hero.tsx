"use client";

// Hero-секция лендинга — финальная версия Этапа 3.
// Фичи: параллакс фото + scroll-indicator + video-ready + zoom-out на загрузке.

import type { ReactNode } from "react";
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

// Variants для staggered появления — slide-only, БЕЗ opacity.
// Lighthouse / web-vitals API исключают элементы с активной opacity-
// transition из LCP-кандидатов. Hero h1 раньше анимировался с
// opacity 0→1, и LCP detection падал (NO_LCP, Performance=0). Slide-
// only сохраняет ощущение «contents settle into place», но текст
// сразу присутствует в DOM с финальной opacity → Chrome подхватывает
// его как valid LCP-candidate.
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 24 },
  visible: {
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

// Склонение «велосипед» по числу (1 велосипед / 2 велосипеда / 5 велосипедов).
function bikesWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "велосипед";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "велосипеда";
  return "велосипедов";
}

export function Hero({ availableBikes }: { availableBikes?: number | null }) {
  const { open, hasPersisted, persistedProgress } = useApply();
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  // Параллакс фона — движется на 20% от скролла (отключается при reduced-motion)
  const imageY = useTransform(scrollY, [0, 1000], prefersReduced ? ["0%", "0%"] : ["0%", "20%"]);

  return (
    <section
      data-theme="dark"
      id="hero"
      className="relative z-20 min-h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text)]"
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

      {/* Mobile scrim — длинный мягкий градиент в чистый чёрный.
          Задача: фото курьера видно сверху, начиная ~40% высоты экран
          уходит в солидный #000, и весь текст hero стоит уже на чистом
          чёрном — не на фото. Раньше текст с фото сливался, читалось
          плохо. Теперь есть чёткая граница photo/text без UI-плашек. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-black md:hidden"
      />
      {/* Desktop scrim — product-forward (байк виден), только лёгкое
          затемнение под eyebrow/CTA/trust-row. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-gradient-to-b from-black/40 via-transparent to-transparent md:block"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 hidden h-[65%] bg-gradient-to-t from-black via-black/85 to-transparent md:block"
      />

      {/* Контент — staggered fade-in снизу-вверх */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 mx-auto flex min-h-[100dvh] max-w-content flex-col px-gutter pb-12 pt-20 sm:pb-32"
      >
        {/* Spacer — толкает весь контент вниз, чтобы фото было видно больше */}
        <div className="flex-1" />

        {/* Eyebrow — только на десктопе. На мобилке убрали: на 360 px
            занимал строку и конкурировал с H1 за внимание, смотрелся
            как подпись. SEO-keyword «электровелосипед» остаётся в
            title/description/layout.tsx schema — индексация не страдает. */}
        <motion.span
          variants={itemVariants}
          className="hidden font-mono text-caption uppercase tracking-[0.08em] text-white/75 md:block"
        >
          Аренда · Санкт-Петербург · Выдача в день обращения
        </motion.span>

        {/* H1 — на мобилке короткий «Вольт U2 в аренду» (3 слова, 1–2
            строки). На десктопе полная SEO-версия с ключом «Электро-
            велосипед». Ключевое слово живёт в eyebrow на мобилке, индекс
            не теряется. */}
        <motion.h1
          variants={itemVariants}
          className="mt-4 font-sans font-bold leading-[0.95] tracking-[-0.03em] text-[clamp(36px,5vw,72px)]"
        >
          <span className="md:hidden">Вольт U2<br />в аренду</span>
          <span className="hidden md:inline">
            Электровелосипед U2<br />в аренду в&nbsp;СПб
          </span>
        </motion.h1>

        {/* Subtitle — полная спецификация + ценовой якорь. «от 633 ₽/день»
            выделен volt-цветом (brand accent), чтобы цена считывалась
            сразу, до того как пользователь прочитает всё предложение. */}
        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-[52ch] font-sans text-body-lg text-mute"
        >
          Топовая модель для курьеров. <span className="whitespace-nowrap">65 км/ч</span>, 2 аккумулятора LiFePO4, <span className="whitespace-nowrap">до 120 км</span> на смену.{" "}
          <span className="font-semibold text-volt">От 633 ₽/день</span> — ниже,
          чем у других прокатов СПб.
        </motion.p>

        {/* Доступность — управляется из кабинета владельца. Лёгкий эффект
            дефицита: «свободно N велосипедов». Скрыто, если число не задано. */}
        {availableBikes != null && (
          <motion.div
            variants={itemVariants}
            className="mt-6 inline-flex items-center gap-2 self-start rounded-pill border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-white/85 backdrop-blur-sm"
          >
            {availableBikes > 0 ? (
              <>
                <span aria-hidden className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-volt opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-volt" />
                </span>
                Свободно {availableBikes} {bikesWord(availableBikes)}
              </>
            ) : (
              <>
                <span aria-hidden className="h-2 w-2 rounded-full bg-white/40" />
                Все велосипеды в аренде
              </>
            )}
          </motion.div>
        )}

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
          {/* Secondary — только на десктопе. На мобилке убран: калькулятор
              достижим через mobile-bottom-nav «Оформить» и nav-бургер;
              текстовый линк под CTA забивал экран. */}
          <a
            href="#calc"
            onClick={() => {
              try { (window as any).ym?.(108583356, "reachGoal", "HERO_CALC_CLICK"); } catch {}
            }}
            className="hidden min-h-[44px] items-center px-2 py-3 font-mono text-[14px] uppercase tracking-[0.08em] text-mute underline-offset-4 hover:text-[var(--text)] hover:underline sm:text-[16px] md:inline-flex"
          >
            Рассчитать заработок ↓
          </a>
        </motion.div>

        {/* Trust-row — 4 факта. На мобилке сетка 2×2 с линейными иконками
            (Lucide-style, volt-цвет) слева от каждого пункта — раньше
            ribbon в одну строку мелким mono уходил в 2 строки и читался
            как подпись, потерянно. Сейчас структурированный grid. На
            десктопе — одна строка как было (там хватает ширины). */}
        <motion.div
          variants={itemVariants}
          className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[11px] uppercase tracking-[0.08em] text-white/70 md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-2"
        >
          <TrustItem icon={<MapPinIcon />}>Черняховского, 24</TrustItem>
          <TrustItem icon={<BatteryIcon />}>2 АКБ в комплекте</TrustItem>
          <TrustItem icon={<ZapIcon />}>Выдача за 2 часа</TrustItem>
          <TrustItem icon={<WrenchIcon />}>Техподдержка 24/7</TrustItem>
        </motion.div>
      </motion.div>

    </section>
  );
}

// ============================================================
// Trust-row — item + иконки (Lucide-style stroke 1.5, currentColor).
// Inline SVG, чтобы не тянуть lucide-react ради 4 иконок.
// ============================================================

function TrustItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-volt">
        {icon}
      </span>
      <span>{children}</span>
    </span>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-full w-full",
};

function MapPinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg {...iconProps}>
      <rect width="16" height="10" x="2" y="7" rx="2" />
      <line x1="22" x2="22" y1="11" y2="13" />
      <line x1="6" x2="6" y1="11" y2="13" />
      <line x1="10" x2="10" y1="11" y2="13" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
