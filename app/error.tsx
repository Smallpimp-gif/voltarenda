"use client";

// Route-level error boundary — ловит run-time ошибки в main layout.
// Стилизация как у not-found.tsx (фирменный dark hero) плюс кнопка reset
// и мессенджер-линки для "я застрял — напишите". Без этого юзер увидел бы
// дефолтный Next.js overlay = "сайт умер".

import Link from "next/link";
import { useEffect } from "react";
import {
  PHONE_DISPLAY,
  PHONE_TEL,
  TELEGRAM_URL,
  VK_URL,
} from "@/lib/contacts";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Метрика — важно знать что куда-то падало в проде
    try {
      (window as any).ym?.(108583356, "reachGoal", "RUNTIME_ERROR", {
        message: error.message,
        digest: error.digest,
      });
    } catch {}
    // eslint-disable-next-line no-console
    console.error("App route error:", error);
  }, [error]);

  return (
    <main
      data-theme="dark"
      className="flex min-h-[100dvh] flex-col bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="mx-auto flex w-full max-w-content flex-1 flex-col justify-between px-gutter py-16 md:py-24">
        <header className="flex items-baseline justify-between border-b border-[var(--line)] pb-6">
          <Link href="/" className="font-sans text-h3">
            Вольтаренда
          </Link>
          <span className="font-mono text-caption uppercase text-mute">
            ERROR / 500
          </span>
        </header>

        <div className="flex flex-col items-start gap-10 py-section-y">
          <span className="font-mono text-caption uppercase text-mute">
            КОД ОШИБКИ / 500 · ВНУТРЕННЯЯ ОШИБКА
          </span>
          <h1 className="max-w-[20ch] font-sans text-display-1">
            Что-то сломалось на нашей стороне.
          </h1>
          <p className="max-w-[52ch] font-sans text-body-lg text-mute">
            Попробуй перезагрузить страницу. Если не помогло — напиши нам во
            ВКонтакте или Telegram, мы подскажем что делать (и поправим причину).
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-volt px-6 py-4 font-mono text-caption uppercase text-ink transition-colors duration-quick ease-out-soft hover:bg-volt-hover"
            >
              Перезагрузить →
            </button>
            <Link
              href="/"
              className="rounded-md border border-[var(--line-strong)] px-6 py-4 font-mono text-caption uppercase transition-colors duration-quick ease-out-soft hover:border-volt hover:text-volt"
            >
              На главную
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 font-mono text-caption uppercase text-mute">
            <a
              href={VK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-quick ease-out-soft hover:text-volt"
            >
              ВКонтакте →
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-quick ease-out-soft hover:text-volt"
            >
              Telegram →
            </a>
            <a
              href={PHONE_TEL}
              className="tnum transition-colors duration-quick ease-out-soft hover:text-volt"
            >
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <footer className="flex flex-col items-start justify-between gap-2 border-t border-[var(--line)] pt-6 font-mono text-caption uppercase tracking-[0.08em] text-mute md:flex-row md:items-center">
          <span>© 2026 Вольтаренда · Санкт‑Петербург</span>
          {error.digest && (
            <span className="tnum text-mute/70">REF: {error.digest}</span>
          )}
        </footer>
      </div>
    </main>
  );
}
