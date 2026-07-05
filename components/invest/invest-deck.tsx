"use client";

// Инвест-колода — оболочка презентации.
// Полноэкранные слайды со scroll-snap, фикс-хедер (лого + счётчик),
// боковая dot-навигация (десктоп), управление клавишами и трекинг
// активного слайда через IntersectionObserver. Тема фикс-UI инвертируется
// под активный слайд — тот же приём, что у sticky-header сайта.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./invest.module.css";
import { SlideHook } from "./slide-hook";
import { SlideMarket } from "./slide-market";
import { SlideClients } from "./slide-clients";
import { SlideModel } from "./slide-model";
import { SlideRisks } from "./slide-risks";
import { SlideStrategy } from "./slide-strategy";
import { SlideTeam } from "./slide-team";
import { SlideCta } from "./slide-cta";

const SLIDES = [
  { id: "hook", theme: "dark", label: "Крючок" },
  { id: "market", theme: "light", label: "Окно" },
  { id: "clients", theme: "dark", label: "Клиенты" },
  { id: "model", theme: "dark", label: "Экономика" },
  { id: "risks", theme: "light", label: "Риски" },
  { id: "strategy", theme: "dark", label: "Стратегия" },
  { id: "team", theme: "light", label: "Команда" },
  { id: "cta", theme: "dark", label: "Заход" },
] as const;

const TOTAL = SLIDES.length;

export function InvestDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Активный слайд — тот, чей верх пересёк «триггер-линию» на ~40% высоты
  // вьюпорта (слайд, занимающий верх экрана). Стабильнее, чем «ближайший
  // верх». Скроллится либо контейнер (десктоп, md:overflow-auto), либо окно
  // (телефон — документный скролл) — слушаем оба.
  useEffect(() => {
    const root = containerRef.current;
    const measure = () => {
      const slides = Array.from(
        document.querySelectorAll<HTMLElement>("[data-invest-slide]")
      );
      if (!slides.length) return;
      const trigger = window.innerHeight * 0.4;
      let best = 0;
      slides.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= trigger) best = i;
      });
      setActive(best);
    };
    // Прямой вызов measure() на scroll: 7 getBoundingClientRect дёшевы, а
    // rAF-троттлинг в части окружений «залипает» (rAF не тикает на idle) и
    // measure перестаёт вызываться. passive-слушатель не блокирует скролл.
    const onScroll = () => measure();
    measure();
    root?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      root?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const go = useCallback((i: number) => {
    const root = containerRef.current;
    if (!root) return;
    const clamped = Math.max(0, Math.min(TOTAL - 1, i));
    const slides = root.querySelectorAll<HTMLElement>("[data-invest-slide]");
    slides[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Управление клавишами — листание колоды стрелками / PageUp-Down.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(active + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        go(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(TOTAL - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  const theme = SLIDES[active].theme;
  const isLast = active === TOTAL - 1;

  return (
    <div className="relative">
      {/* ── Фикс-хедер: лого + счётчик. Тема под активный слайд. ── */}
      <div
        data-theme={theme}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-[var(--bg)] from-[72%] to-transparent pb-9 text-[var(--text)] transition-colors duration-base ease-out-soft"
      >
        <div className="mx-auto flex max-w-[1560px] items-center justify-between px-gutter pt-[5.6vh] pb-6">
          {/* На обложке (слайд 1) лого скрыто — там есть крупный вордмарк. */}
          <a
            href="#hook"
            aria-label="ВольтАренда — наверх"
            className={`pointer-events-auto inline-flex items-center transition-opacity duration-base ${
              active === 0 ? "opacity-0" : "opacity-100"
            }`}
          >
            <Image
              src="/logo.svg"
              alt="Вольтаренда"
              width={150}
              height={14}
              priority
              className="h-3.5 w-auto transition-[filter] duration-base ease-out-soft md:h-4"
              style={{ filter: theme === "dark" ? "none" : "brightness(0)" }}
            />
          </a>
          <div className="flex items-center gap-2 font-mono text-caption uppercase tracking-[0.08em]">
            <span className="tnum text-[var(--text)]">
              {String(active + 1).padStart(2, "0")}
            </span>
            <span className="text-mute">—</span>
            <span className="tnum text-mute">{String(TOTAL).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* ── Боковая dot-навигация (десктоп) ── */}
      <nav
        data-theme={theme}
        aria-label="Навигация по слайдам"
        className="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Слайд ${i + 1}: ${s.label}`}
            aria-current={i === active}
            className="group flex h-6 items-center justify-center"
          >
            <span
              className={`rounded-pill transition-all duration-base ease-out-soft ${
                i === active
                  ? "h-6 w-1.5 bg-volt"
                  : "h-1.5 w-1.5 bg-[var(--line-strong)] group-hover:bg-[var(--text)]"
              }`}
            />
          </button>
        ))}
      </nav>

      {/* ── Подсказка «листай вниз» — только на первом слайде и только на
          md+ (на телефоне обычный документный скролл, подсказка не нужна
          и налезает на контент) ── */}
      <button
        type="button"
        onClick={() => go(active + 1)}
        data-theme={theme}
        aria-label="Следующий слайд"
        className={`fixed bottom-5 left-1/2 z-50 hidden -translate-x-1/2 text-[var(--text)] transition-opacity duration-base ease-out-soft md:block ${
          active === 0 ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="flex flex-col items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70">
          листай
          <ChevronDown />
        </span>
      </button>

      {/* ── Кнопка «наверх» — на последнем слайде ── */}
      <button
        type="button"
        onClick={() => go(0)}
        data-theme={theme}
        aria-label="В начало"
        className={`fixed bottom-5 right-5 z-50 hidden text-[var(--text)] transition-opacity duration-base ease-out-soft lg:block ${
          isLast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
          в начало
          <ChevronUp />
        </span>
      </button>

      {/* ── Скролл-контейнер слайдов ── */}
      {/* Телефон: обычный скролл страницы (контейнер по высоте контента, без
          снапа). md+: полноэкранный снап-скроллер. */}
      <div
        ref={containerRef}
        className="overflow-x-hidden md:h-[100svh] md:snap-y md:snap-proximity md:overflow-y-auto md:scroll-smooth"
      >
        <SlideHook />
        <SlideMarket />
        <SlideClients />
        <SlideModel />
        <SlideRisks />
        <SlideStrategy />
        <SlideTeam />
        <SlideCta />
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${styles.nudge}`}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}
