"use client";

// Mobile bottom navigation bar — sticky нижняя панель с табами и главным CTA.
// Заменяет прежнюю "плавающую кнопку Оформить". Три таба навигации слева
// + волт-кнопка "Оформить" справа. Только на мобиле (md:hidden).

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApply } from "./apply";

const NAV_TABS = [
  { href: "#tariffs", label: "Тарифы" },
  { href: "#calc", label: "Доход" },
  { href: "#location", label: "Точка" },
];

export function MobileBottomNav() {
  const { open, hasPersisted, persistedProgress } = useApply();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => {
      setShow(window.scrollY > window.innerHeight * 0.3);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          <div className="flex items-center gap-2 px-3 py-3">
            {/* Nav-табы слева */}
            <nav className="flex flex-1 items-center justify-around">
              {NAV_TABS.map((tab) => (
                <a
                  key={tab.href}
                  href={tab.href}
                  className="flex min-h-[44px] items-center justify-center rounded-md px-2 py-3 font-mono text-caption uppercase tracking-[0.08em] text-white/80 transition-colors active:bg-white/10 active:text-white"
                >
                  {tab.label}
                </a>
              ))}
            </nav>

            {/* Волт-кнопка справа: «Оформить» по умолчанию, или
                «Продолжить N/4» если у пользователя уже есть
                недозаполненная заявка в localStorage. */}
            <button
              type="button"
              onClick={() => open()}
              className="btn-cta btn-cta-volt flex min-h-[44px] shrink-0 items-center gap-2 rounded-md bg-volt px-4 py-3.5 font-mono text-caption uppercase text-ink active:bg-volt-hover"
            >
              <span>{hasPersisted ? "Продолжить" : "Оформить"}</span>
              <span>→</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
