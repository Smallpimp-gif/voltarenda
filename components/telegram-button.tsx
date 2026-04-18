"use client";

// Плавающая кнопка Telegram — прячется при скролле вниз, появляется
// при скролле вверх (паттерн Самокат/iOS Safari). Не перекрывает контент
// во время чтения, но всегда доступна при обратном скролле.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TELEGRAM_URL } from "@/lib/contacts";

export function TelegramButton() {
  const [visible, setVisible] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    // Задержка 2 сек перед первым показом
    const t = setTimeout(() => setArmed(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!armed) return;
    let lastY = window.scrollY;
    let ticking = false;

    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Показываем: скролл вверх ИЛИ в самом верху страницы
        if (y < lastY || y < 100) {
          setVisible(true);
        } else if (y > lastY + 10) {
          // Прячем: скролл вниз (с порогом 10px чтобы не моргало)
          setVisible(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    setVisible(true); // Показать сразу после arm
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [armed]);

  return (
    <AnimatePresence>
      {armed && visible && (
        <motion.a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Написать в Telegram"
          onClick={() => {
            try { (window as any).ym?.(108583356, "reachGoal", "TELEGRAM_CLICK"); } catch {}
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          // hidden md:flex — на мобиле TG-путь живёт в sticky bottom bar
          // (components/mobile-bottom-nav.tsx), плавающая кнопка была
          // дублем. На md+ sticky bottom скрыт (md:hidden) → плавающая
          // становится единственным TG-путём на десктопе.
          className="fixed bottom-20 right-4 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#2AABEE] shadow-lg shadow-[#2AABEE]/30 transition-transform duration-200 ease-out hover:scale-110 active:scale-95 md:flex sm:bottom-6 sm:right-6"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.28-.02-.12.03-2.02 1.28-5.69 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.41-.27-2.1-.5-.85-.28-1.52-.43-1.46-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z"
              fill="white"
            />
          </svg>
          {/* Pulse dot — stops after 5s via CSS animation-iteration-count */}
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full bg-volt opacity-75"
              style={{ animation: "ping 1s cubic-bezier(0,0,0.2,1) 5" }}
            />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-volt" />
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
