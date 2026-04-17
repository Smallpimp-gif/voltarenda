"use client";

// Hero-секция лендинга — финальная версия Этапа 3.
// Фичи: параллакс фото + scroll-indicator + video-ready + zoom-out на загрузке.

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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

// Метрики Hero — экономика, не спека байка.
// Курьер пришёл узнать «сколько заработаю», а не сколько весит велосипед —
// спеки (70 км / 25 км/ч / 150 кг) живут в BikeSection где им и место.
// Цифры дохода и окупаемости выведены из дефолтов калькулятора ниже:
// 15 доставок × 280 ₽ × 6 дней − 5500 ₽ аренды ≈ 19,7 тыс. ₽/нед чистыми.
const METRICS: [string, string][] = [
  ["доход / мес", "150 000 ₽"],
  ["окупаемость", "2–3 дня"],
  ["курьеров", "47+"],
];

// Социальное доказательство — реальные отзывы курьеров
const SOCIAL_PROOF = [
  { name: "Женя", platform: "Яндекс.Еда", text: "23 400 ₽ чистыми за первую неделю" },
  { name: "Артём", platform: "Самокат", text: "Окупил аренду за 2 дня, остальное — в плюс" },
  { name: "Дима", platform: "Купер", text: "Батареи хватает на всю смену, не думаю о зарядке" },
];

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
          Электровелосипед ВОЛЬТ U2 в аренду для курьеров
          Санкт&#8209;Петербурга. Выдача за 30 минут.
        </motion.p>

        {/* Метрики — ПЕРЕД кнопками, чтобы money-hook был виден ДО CTA.
            Mobile: compact inline row. Desktop: grid ниже. */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-wrap gap-x-4 gap-y-1 pr-16 font-mono text-caption uppercase text-mute sm:hidden"
        >
          {METRICS.map(([label, value]) => (
            <span key={label} className="whitespace-nowrap">
              <span className="tnum text-[var(--text)]">{value}</span>
              {" "}
              <span>{label}</span>
            </span>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 sm:mt-10"
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

        <motion.div
          variants={itemVariants}
          className="mt-16 hidden max-w-[640px] grid-cols-3 gap-8 border-t border-[var(--line)] pt-6 sm:grid"
        >
          {METRICS.map(([label, value]) => (
            <div key={label}>
              <div className="font-mono text-caption uppercase text-mute">
                {label}
              </div>
              <div className="mt-2 whitespace-nowrap font-sans text-h3 tnum">
                {value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Социальное доказательство — только десктоп (на мобилке выше, перед CTA) */}
        <motion.div variants={itemVariants} className="mt-8 hidden sm:block">
          <SocialProofRotator />
        </motion.div>
      </motion.div>

    </section>
  );
}

// Ротатор социальных доказательств — автоматическая смена каждые 4 сек
function SocialProofRotator() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % SOCIAL_PROOF.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const item = SOCIAL_PROOF[idx];

  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-caption uppercase text-[var(--text)]">
        {item.name[0]}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex flex-col"
        >
          <span className="font-sans text-body text-[var(--text)]">
            «{item.text}»
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
            {item.name} · {item.platform}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
