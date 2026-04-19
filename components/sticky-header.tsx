"use client";

// Sticky header с двумя скролл-эффектами:
// 1. Scroll-driven инверсия темы через IntersectionObserver (темная/светлая).
// 2. Fade-in + slide-down на первых 100px скролла.
// На мобиле вместо "НАЧАТЬ" — burger-иконка, при клике раскрывается
// full-screen overlay-меню с навигацией и CTA.

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useApply } from "./apply";

type Theme = "light" | "dark";

const NAV = [
  { href: "#how", label: "Как работает" },
  { href: "#bike", label: "Велосипед" },
  { href: "#tariffs", label: "Тарифы" },
  { href: "#calc", label: "Калькулятор" },
  { href: "#location", label: "Точка выдачи" },
  { href: "#faq", label: "FAQ" },
];

export function StickyHeader() {
  const { open: openApply, hasPersisted, persistedProgress } = useApply();
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Подмена лейбла CTA, когда у пользователя уже есть недозаполненная
  // заявка в localStorage — он видит свой прогресс в той же кнопке,
  // которой бы нажимал «Начать», без отдельных floating-баннеров.
  const ctaLabel = hasPersisted
    ? `Продолжить · ${persistedProgress}/4`
    : "Начать";
  const fullCtaLabel = hasPersisted
    ? `Продолжить заявку · ${persistedProgress}/4`
    : "Начать зарабатывать";

  // Theme-switching: раньше использовался IntersectionObserver с
  // thresholds + ratio-sorting. Ломалось на больших секциях — bike-section
  // это h-[200vh]=2504px, а observer-root после rootMargin всего ~186px,
  // ratio = 186/2504 = 0.07 < threshold 0.1 → callback не стреляет при
  // переходе. Header залипал в светлой теме на тёмном bike и наоборот.
  //
  // Новый подход — probe-line: под самым header'ом (y=80px) смотрим,
  // какая секция именно там. Её data-theme и есть тема header'а. Это
  // надёжно для секций любой высоты и стабильно при программном скролле.
  useEffect(() => {
    const PROBE_Y = 80;
    let ticking = false;
    const update = () => {
      const sections = document.querySelectorAll<HTMLElement>(
        "section[data-theme], footer[data-theme]"
      );
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= PROBE_Y && r.bottom > PROBE_Y) {
          const t = s.getAttribute("data-theme") as Theme | null;
          if (t) setTheme(t);
          return;
        }
      }
    };
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    };
    update();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  // Отслеживание скролла для тени хедера
  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Блокировка скролла body когда открыто full-screen меню.
  // Параллельно эмитим voltmenu-событие — MobileBottomNav уезжает вниз
  // чтобы не конкурировать со своей же CTA-кнопкой внутри меню.
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    window.dispatchEvent(new CustomEvent("voltmenu", { detail: { open: menuOpen } }));
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // ESC закрытие бургер-меню
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        data-theme={theme}
        className={`fixed left-0 right-0 top-0 z-[60] border-b border-[var(--line)] bg-[var(--bg)] text-[var(--text)] transition-[color,background-color,border-color,box-shadow] duration-base ease-out-soft ${scrolled ? "header-shadow" : ""}`}
      >
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-gutter">
          <a
            href="#hero"
            onClick={closeMenu}
            className="inline-flex min-h-[44px] items-center"
            aria-label="На главную"
          >
            <Image
              src="/logo.svg"
              alt="Вольтаренда"
              width={160}
              height={15}
              // На мобилке 12px (-25% от десктопа) — забирал слишком много
              // хедера на 360–414 px, конкурировал с бургер-иконкой.
              className="h-3 w-auto transition-[filter] duration-base ease-out-soft md:h-4"
              // dark — родной цвет SVG (жёлтый #EAFF02, brand accent).
              // light — brightness(0) делает лого чёрным для контраста
              // на бежевом фоне (жёлтый #EAFF02 на #F4F3F1 не читается).
              style={{
                filter: theme === "dark" ? "none" : "brightness(0)",
              }}
              priority
            />
          </a>

          {/* Desktop: inline nav + "Начать" кнопка */}
          <nav aria-label="Основная навигация" className="hidden gap-8 font-mono text-caption uppercase text-mute lg:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="link-underline transition-colors duration-quick ease-out-soft hover:text-[var(--text)]"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => openApply()}
            className="btn-cta btn-cta-volt hidden rounded-md bg-volt px-4 py-2 font-mono text-caption uppercase text-ink hover:bg-volt-hover lg:inline-block"
          >
            {ctaLabel} →
          </button>

          {/* Mobile: burger icon вместо всех nav-ссылок */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            className="flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <div className="relative h-4 w-6">
              <span
                className={`absolute left-0 top-0 h-[2px] w-full bg-[var(--text)] transition-transform duration-base ease-out-soft ${
                  menuOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-[2px] w-full bg-[var(--text)] transition-opacity duration-base ease-out-soft ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] h-[2px] w-full bg-[var(--text)] transition-transform duration-base ease-out-soft ${
                  menuOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Full-screen overlay меню на мобиле */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            data-theme="dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            className="fixed inset-0 z-[45] bg-[var(--bg)] text-[var(--text)] lg:hidden"
          >
            <div className="flex h-full flex-col px-gutter pb-[calc(16px+env(safe-area-inset-bottom))] pt-24">
              <nav aria-label="Мобильное меню" className="flex flex-1 flex-col justify-center gap-2">
                {NAV.map((n, i) => (
                  <motion.a
                    key={n.href}
                    href={n.href}
                    onClick={(e) => {
                      // Клик по пункту меню: делаем scroll programmatically
                      // после закрытия overlay. Нативный anchor jump стрелял
                      // пока body { overflow: hidden } ещё применён оверлеем,
                      // и scroll просто не происходил. rAF x2 даёт React
                      // коммитнуть menuOpen=false, useEffect снять overflow,
                      // после чего smooth scroll отрабатывает чисто.
                      e.preventDefault();
                      closeMenu();
                      const href = n.href;
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          const el = document.querySelector(href);
                          el?.scrollIntoView({ behavior: "smooth", block: "start" });
                          // Обновим URL-хэш без прыжка
                          history.replaceState(null, "", href);
                        });
                      });
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.1 + i * 0.06,
                      ease: [0.22, 0.61, 0.36, 1],
                    }}
                    className="flex items-baseline justify-between border-b border-[var(--line)] py-6 font-sans text-h2"
                  >
                    <span>{n.label}</span>
                    <span className="font-mono text-caption uppercase text-mute">
                      0{i + 1}
                    </span>
                  </motion.a>
                ))}
              </nav>

              {/* Brand symbol — тихий якорь */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.08 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="pointer-events-none mt-auto flex justify-center"
              >
                <Image
                  src="/symbol.svg"
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 brightness-0 invert"
                />
              </motion.div>

              <motion.button
                type="button"
                onClick={() => {
                  closeMenu();
                  // rAF чтобы overflow="hidden" от меню сбросился
                  // до того как модалка поставит свой
                  requestAnimationFrame(() => openApply());
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                className="btn-cta btn-cta-volt mt-6 flex items-center justify-between rounded-md bg-volt px-6 py-5 font-mono text-caption uppercase text-ink hover:bg-volt-hover"
              >
                <span>{fullCtaLabel}</span>
                <span>→</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
