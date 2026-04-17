// Общий layout юр. страниц — тёмная тема, sticky header + кнопка на главную.

import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main
      data-theme="dark"
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-gutter">
          <Link href="/" className="font-sans text-h3">
            Вольтаренда
          </Link>
          <Link
            href="/"
            className="font-mono text-caption uppercase text-mute transition-colors duration-quick ease-out-soft hover:text-volt"
          >
            ← НА ГЛАВНУЮ
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-[720px] px-gutter py-16 md:py-24">
        {children}
      </article>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-2 px-gutter py-6 pb-24 font-mono text-[11px] uppercase tracking-[0.08em] text-mute md:flex-row md:items-center md:pb-6">
          <span>Семенов Евгений Ильич · Санкт‑Петербург · +7 (901) 300-03-19</span>
          <span>© 2026 Вольтаренда</span>
        </div>
      </footer>
    </main>
  );
}
