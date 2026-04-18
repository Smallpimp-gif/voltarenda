"use client";

// Mobile sticky bottom bar — три канала конверсии:
// 1. [ВК-иконка] — ВКонтакте (основной мессенджер российской курьерской
//    ЦА — сообщество бренда, переписка через «Написать сообществу»).
// 2. [TG-иконка] — Telegram (@Voltarenda), вторичный канал.
// 3. [Оформить заявку →] — открывает apply-модалку (5 шагов).
//
// Появляется после 30% скролла Hero. До этого — только плавающая
// TelegramButton справа-снизу. Только на мобиле (md:hidden).

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApply } from "./apply";
import { TELEGRAM_URL, VK_URL } from "@/lib/contacts";

export function MobileBottomNav() {
  const { open, hasPersisted, persistedProgress } = useApply();
  const [show, setShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setShow(window.scrollY > window.innerHeight * 0.3);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Слушаем voltmenu-событие от sticky-header — когда бургер открыт,
  // прячем sticky CTA вниз (чтобы не дублировать кнопку внутри меню).
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ open: boolean }>;
      setMenuOpen(Boolean(custom.detail?.open));
    };
    window.addEventListener("voltmenu", handler);
    return () => window.removeEventListener("voltmenu", handler);
  }, []);

  const visible = show && !menuOpen;

  // Без цены: «3 500 ₽» (3-дневный тариф) конфликтовал с «От 633 ₽/день»
  // в Hero subtitle — два разных числа на расстоянии одного скролла,
  // курьер думает «обманули». Цены живут в Tariffs (секция 03).
  const label = hasPersisted
    ? `Продолжить · ${persistedProgress}/4`
    : "Начать зарабатывать";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          <div className="flex items-center gap-2 px-3 py-3">
            {/* ВК — основной мессенджер российской курьерской ЦА. Цвет
                бренда #0077FF (VK modern). Ведёт на сообщество, внутри
                пользователь жмёт «Написать сообществу». */}
            <a
              href={VK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Написать во ВКонтакте"
              onClick={() => {
                try { (window as any).ym?.(108583356, "reachGoal", "VK_CLICK", { source: "sticky-mobile" }); } catch {}
              }}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-[#0077FF] text-white shadow-lg shadow-[#0077FF]/25 transition-transform duration-150 ease-out active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.576-1.496c.588-.19 1.341 1.26 2.14 1.818.605.422 1.064.33 1.064.33l2.137-.03s1.117-.071.588-.964c-.043-.073-.308-.661-1.588-1.87-1.34-1.264-1.16-1.059.453-3.246.983-1.332 1.376-2.145 1.253-2.493-.117-.332-.84-.244-.84-.244l-2.406.015s-.178-.025-.31.056c-.13.079-.212.262-.212.262s-.382 1.03-.89 1.907c-1.07 1.85-1.499 1.948-1.674 1.832-.407-.267-.305-1.075-.305-1.648 0-1.793.267-2.54-.521-2.733-.262-.065-.454-.107-1.123-.114-.858-.009-1.585.003-1.996.208-.274.136-.485.44-.356.457.159.022.519.099.71.363.246.341.237 1.107.237 1.107s.142 2.11-.33 2.371c-.325.18-.77-.187-1.725-1.865-.489-.859-.859-1.81-.859-1.81s-.07-.176-.199-.27c-.156-.113-.374-.149-.374-.149l-2.286.015s-.343.01-.469.161c-.111.134-.008.413-.008.413s1.79 4.258 3.817 6.403c1.858 1.967 3.968 1.838 3.968 1.838z" />
              </svg>
            </a>

            {/* TG — вторичный канал, сохранён для тех кто уже в @Voltarenda. */}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Написать в Telegram"
              onClick={() => {
                try { (window as any).ym?.(108583356, "reachGoal", "TELEGRAM_CLICK", { source: "sticky-mobile" }); } catch {}
              }}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-[#2AABEE] text-white shadow-lg shadow-[#2AABEE]/25 transition-transform duration-150 ease-out active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.28-.02-.12.03-2.02 1.28-5.69 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.41-.27-2.1-.5-.85-.28-1.52-.43-1.46-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z"
                  fill="currentColor"
                />
              </svg>
            </a>

            {/* CTA — остаётся основным путём (жёлтый volt, full-width) */}
            <button
              type="button"
              onClick={() => {
                try { (window as any).ym?.(108583356, "reachGoal", "CTA_CLICK", { source: "sticky-mobile" }); } catch {}
                open();
              }}
              className="btn-cta btn-cta-volt flex min-h-[52px] flex-1 items-center justify-between gap-2 rounded-md bg-volt px-5 py-4 font-mono text-caption uppercase text-ink active:bg-volt-hover"
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
