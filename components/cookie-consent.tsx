"use client";

// Cookie consent баннер — 152-ФЗ требует информировать об использовании
// cookies. Показывается один раз, после принятия сохраняем в localStorage
// и больше не показываем.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "voltarenda-cookies-accepted";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Показываем только если ещё не принял.
    // try-catch: Safari в приватном режиме бросает на localStorage.
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) {
        const t = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage недоступен — показываем баннер
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[70] p-4 sm:bottom-[calc(24px+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:max-w-[420px]"
        >
          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-5 shadow-xl"
            data-theme="dark"
          >
            <p className="font-sans text-sm leading-relaxed text-white/80">
              Мы используем cookies для аналитики и улучшения сервиса.
              Продолжая пользоваться сайтом, ты соглашаешься с{" "}
              <a
                href="/legal/cookies"
                className="underline underline-offset-2 transition-colors hover:text-volt"
              >
                политикой cookies
              </a>
              .
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={accept}
                className="btn-cta btn-cta-volt rounded-md bg-volt px-5 py-3 font-mono text-caption uppercase text-ink hover:bg-volt-hover"
              >
                Принять
              </button>
              <a
                href="/legal/cookies"
                className="font-mono text-caption uppercase text-white/50 transition-colors hover:text-white"
              >
                Подробнее
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
