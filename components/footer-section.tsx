"use client";

// Объединённый "подвал" лендинга — финальная CTA + колонки контактов/ссылок +
// юр. строка. Одна тёмная секция, один scroll-reveal, никакого двойного
// подвала как было раньше (FinalCTA + Footer отдельно).

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useApply } from "./apply";
import { EASE, SMOOTH_SCROLL } from "./motion-config";
import {
  EMAIL,
  EMAIL_MAILTO,
  PHONE_DISPLAY,
  PHONE_TEL,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
  VK_HANDLE,
  VK_URL,
} from "@/lib/contacts";

const FOOTER_SECTIONS: { href: string; label: string }[] = [
  { href: "#how", label: "Как работает" },
  { href: "#bike", label: "ВОЛЬТ U2" },
  { href: "#tariffs", label: "Тарифы" },
  { href: "#calc", label: "Калькулятор" },
  { href: "#location", label: "Точка выдачи" },
  { href: "#faq", label: "FAQ" },
];

const FOOTER_DOCS: { href: string; label: string }[] = [
  { href: "/legal/offer", label: "Договор оферты" },
  { href: "/legal/privacy", label: "Политика конфиденциальности" },
  { href: "/legal/cookies", label: "Использование cookies" },
];

const FOOTER_CONTACTS: { href: string; label: string; external?: boolean }[] = [
  { href: PHONE_TEL, label: PHONE_DISPLAY },
  { href: VK_URL, label: VK_HANDLE, external: true },
  { href: TELEGRAM_URL, label: TELEGRAM_HANDLE, external: true },
  { href: EMAIL_MAILTO, label: EMAIL },
];

export function FooterSection() {
  const { open, hasPersisted, persistedProgress } = useApply();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 20%"],
  });
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // Большой заголовок
  const titleOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1], { ease: EASE });
  const titleScale = useTransform(scrollYProgress, [0, 0.4], [0.92, 1], { ease: EASE });
  const titleBlurVal = useTransform(scrollYProgress, [0, 0.4], [8, 0], { ease: EASE });
  const titleBlur = useMotionTemplate`blur(${titleBlurVal}px)`;
  const titleY = useTransform(scrollYProgress, [0, 0.4], [40, 0], { ease: EASE });

  // Описание
  const descOpacity = useTransform(scrollYProgress, [0.15, 0.55], [0, 1], { ease: EASE });
  const descY = useTransform(scrollYProgress, [0.15, 0.55], [24, 0], { ease: EASE });

  // CTA
  const ctaOpacity = useTransform(scrollYProgress, [0.25, 0.65], [0, 1], { ease: EASE });
  const ctaY = useTransform(scrollYProgress, [0.25, 0.65], [24, 0], { ease: EASE });
  const ctaScale = useTransform(scrollYProgress, [0.25, 0.65], [0.94, 1], { ease: EASE });

  // Meta + footer columns
  const metaOpacity = useTransform(scrollYProgress, [0.35, 0.75], [0, 1], { ease: EASE });

  return (
    <motion.footer
      ref={sectionRef}
      data-theme="dark"
      id="final"
      className="relative bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="mx-auto max-w-content px-gutter">
        {/* ============================================================
            CTA — в стиле остального сайта (тёмный, volt-акцент)
            ============================================================ */}
        <div className="flex flex-col items-start gap-8 border-b border-[var(--line)] pb-16 pt-section-y">
          <motion.span
            style={{ opacity: titleOpacity, y: titleY }}
            className="font-mono text-caption uppercase text-mute"
          >
            ОФОРМЛЕНИЕ
          </motion.span>
          <motion.h2
            style={{ opacity: titleOpacity, scale: titleScale, filter: titleBlur, y: titleY }}
            className="max-w-[16ch] font-sans text-display-1"
          >
            Начни зарабатывать сегодня
          </motion.h2>
          <motion.p
            style={{ opacity: descOpacity, y: descY }}
            className="max-w-[44ch] font-sans text-body-lg text-mute"
          >
            Оформи заявку — заберёшь велик через пару часов и выйдешь на первую смену.
            От 633 ₽/день, выдача в тот же день.
          </motion.p>
          <motion.div
            style={{ opacity: ctaOpacity, y: ctaY, scale: ctaScale }}
            className="flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={() => open()}
              className="btn-cta btn-cta-volt group/cta inline-flex items-center gap-4 rounded-md bg-volt px-8 py-5 font-mono text-caption uppercase text-ink hover:bg-volt-hover"
            >
              <span>
                {hasPersisted
                  ? `Продолжить заявку · ${persistedProgress}/4`
                  : "Начать зарабатывать"}
              </span>
              <span
                aria-hidden
                className="font-sans text-base transition-transform duration-base ease-out-soft group-hover/cta:translate-x-1"
              >
                →
              </span>
            </button>
            <a
              href={PHONE_TEL}
              className="btn-cta btn-cta-outline rounded-md border border-[var(--line-strong)] px-6 py-5 font-mono text-caption uppercase hover:border-volt hover:text-volt"
            >
              Позвонить
            </a>
          </motion.div>
        </div>

        {/* ============================================================
            Bottom — 2-колоночный layout как у icomat
            ============================================================ */}
        <motion.div
          style={{ opacity: metaOpacity }}
          className="mt-16 grid grid-cols-1 gap-12 border-t border-[var(--line)] pt-12 md:grid-cols-[1.4fr_1fr]"
        >
          {/* Левая колонка — бренд + описание + контакты */}
          <div>
            <div className="flex items-center gap-3">
              {/* Родной цвет SVG — #EAFF02 (volt), читается на dark footer
                  без CSS-фильтров. Раньше был brightness-0 invert (белый) —
                  убрал ради brand-accent жёлтого в firma logo. */}
              <Image
                src="/symbol.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <Image
                src="/logo.svg"
                alt="Вольтаренда"
                width={140}
                height={13}
                className="h-3.5 w-auto"
              />
            </div>
            <p className="mt-4 max-w-[32ch] font-sans text-body text-mute">
              Электровелосипеды ВОЛЬТ U2 в аренду для курьеров Санкт‑Петербурга. Выдача в тот же день.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {FOOTER_CONTACTS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noopener noreferrer" : undefined}
                  className="link-underline w-fit font-mono text-body tnum text-[var(--text)] transition-colors duration-quick ease-out-soft hover:text-volt"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Правая колонка — 2 столбика навигации */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="font-mono text-caption uppercase text-mute">
                Разделы
              </div>
              <ul className="mt-4 flex flex-col gap-1">
                {FOOTER_SECTIONS.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="link-underline inline-block py-1.5 font-sans text-body transition-colors duration-quick ease-out-soft hover:text-volt"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-mono text-caption uppercase text-mute">
                Документы
              </div>
              <ul className="mt-4 flex flex-col gap-1">
                {FOOTER_DOCS.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="link-underline inline-block py-1.5 font-sans text-body transition-colors duration-quick ease-out-soft hover:text-volt"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Юр. строка */}
        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-[var(--line)] py-6 pb-[calc(96px+env(safe-area-inset-bottom))] font-mono text-[11px] uppercase tracking-[0.08em] text-mute md:flex-row md:items-center md:pb-6">
          <span>ИП Семенов Евгений Ильич · Санкт‑Петербург · <span className="whitespace-nowrap">+7 (901) 300-03-19</span></span>
          <span>© 2026 Вольтаренда</span>
        </div>
      </div>
    </motion.footer>
  );
}
