"use client";

// Роудмап партнёра — оболочка презентации.
// Тот же движок, что у инвест-колоды: полноэкранные слайды со scroll-snap,
// фикс-хедер (лого + счётчик), боковая dot-навигация (десктоп), управление
// клавишами и трекинг активного слайда. Тема фикс-UI инвертируется под
// активный слайд. Примитивы и CSS-анимации переиспользуем из /invest —
// единый бренд, один визуальный язык.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "@/components/invest/invest.module.css";
import { SlideCover } from "./slide-cover";
import { SlideStep } from "./slide-step";
import { SlideSpace } from "./slide-space";
import { SlideTimeline } from "./slide-timeline";
import { SlideEconomics } from "./slide-economics";
import { SlideSplit } from "./slide-split";
import { SlideContribution } from "./slide-contribution";
import { SlideApproach } from "./slide-approach";
import { SlideTerms } from "./slide-terms";
import { SlideCta } from "./slide-cta";

const SLIDES = [
  { id: "cover", theme: "dark", label: "Старт" },
  { id: "step", theme: "light", label: "Вход" },
  { id: "space", theme: "dark", label: "Помещение" },
  { id: "timeline", theme: "light", label: "Запуск" },
  { id: "economics", theme: "dark", label: "Экономика" },
  { id: "split", theme: "light", label: "Деньги" },
  { id: "contribution", theme: "dark", label: "Наш вклад" },
  { id: "approach", theme: "dark", label: "Подход" },
  { id: "terms", theme: "dark", label: "Условия" },
  { id: "cta", theme: "dark", label: "Дальше" },
] as const;

const TOTAL = SLIDES.length;

export function PartnerDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Активный слайд — тот, чей верх пересёк «триггер-линию» на ~40% высоты
  // вьюпорта. Скроллится либо контейнер (десктоп), либо окно (телефон) —
  // слушаем оба.
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
            href="#cover"
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
            <span className="relative h-[3px] w-10 overflow-hidden rounded-pill bg-[var(--line-strong)]">
              <span
                className="absolute inset-y-0 left-0 rounded-pill bg-[var(--text)] transition-transform duration-base ease-out-soft"
                style={{ width: `${100 / TOTAL}%`, transform: `translateX(${active * 100}%)` }}
              />
            </span>
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
                  ? `h-6 w-1.5 ${theme === "dark" ? "bg-volt" : "bg-ink"}`
                  : "h-1.5 w-1.5 bg-[var(--line-strong)] group-hover:bg-[var(--text)]"
              }`}
            />
          </button>
        ))}
      </nav>

      {/* ── Подсказка «листай вниз» — только на первом слайде, md+ ── */}
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
      <div
        ref={containerRef}
        className="overflow-x-hidden md:h-[100svh] md:snap-y md:snap-proximity md:overflow-y-auto md:scroll-smooth"
      >
        <SlideCover />
        <SlideStep />
        <SlideSpace />
        <SlideTimeline />
        <SlideEconomics />
        <SlideSplit />
        <SlideContribution />
        <SlideApproach />
        <SlideTerms />
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
