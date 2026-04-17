"use client";

// Mobile sticky CTA — одна full-width кнопка, которая появляется после 30%
// скролла. PM-решение: заменили три nav-таба + маленькую кнопку на один
// ясный путь к оплате. Меньше когнитивной нагрузки, всегда видимый CTA.
// Только на мобиле (md:hidden).

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApply } from "./apply";

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

  const label = hasPersisted
    ? `Продолжить заявку · ${persistedProgress}/4`
    : "Оформить за 3 500 ₽";

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
          <div className="px-3 py-3">
            <button
              type="button"
              onClick={() => {
                try { (window as any).ym?.(108583356, "reachGoal", "CTA_CLICK", { source: "sticky-mobile" }); } catch {}
                open();
              }}
              className="btn-cta btn-cta-volt flex w-full min-h-[52px] items-center justify-between gap-2 rounded-md bg-volt px-5 py-4 font-mono text-caption uppercase text-ink active:bg-volt-hover"
            >
              <span>{label}</span>
              <span aria-hidden>→</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
