"use client";

// Mobile sticky bottom bar — три канала конверсии:
// 1. [WA-иконка] — WhatsApp (приоритет для курьерской ЦА в РФ, часть
//    которой — мигранты с основным мессенджером WA).
// 2. [TG-иконка] — Telegram (@Voltarenda), вторичный канал.
// 3. [Оформить заявку →] — открывает apply-модалку (5 шагов).
//
// Появляется после 30% скролла Hero. До этого — только плавающая
// TelegramButton справа-снизу. Только на мобиле (md:hidden).

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApply } from "./apply";
import { TELEGRAM_URL, WHATSAPP_URL_WITH_INTENT } from "@/lib/contacts";

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
            {/* WA — приоритетный мессенджер для курьерской ЦА в РФ.
                Цвет бренда WhatsApp #25D366. ?text=… открывает чат
                с преднаполненным запросом «интересует аренда». */}
            <a
              href={WHATSAPP_URL_WITH_INTENT}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Написать в WhatsApp"
              onClick={() => {
                try { (window as any).ym?.(108583356, "reachGoal", "WHATSAPP_CLICK", { source: "sticky-mobile" }); } catch {}
              }}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 transition-transform duration-150 ease-out active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
