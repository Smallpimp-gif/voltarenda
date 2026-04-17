// 404 — не найдено. Стилистика как у лендинга: eyebrow + большой h1 + CTA.

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страница не найдена",
  description: "Запрошенная страница не существует. Вернись на главную.",
};

export default function NotFound() {
  return (
    <main
      data-theme="dark"
      className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="mx-auto flex w-full max-w-content flex-1 flex-col justify-between px-gutter py-16 md:py-24">
        {/* Top eyebrow + brand */}
        <header className="flex items-baseline justify-between border-b border-[var(--line)] pb-6">
          <Link href="/" className="font-sans text-h3">
            Вольтаренда
          </Link>
          <span className="font-mono text-caption uppercase text-mute">
            ERROR / 404
          </span>
        </header>

        {/* Большой центр */}
        <div className="flex flex-col items-start gap-10 py-section-y">
          <span className="font-mono text-caption uppercase text-mute">
            КОД ОШИБКИ / 404 · NOT FOUND
          </span>
          <h1 className="max-w-[18ch] font-sans text-display-1">
            Такой страницы нет.
          </h1>
          <p className="max-w-[52ch] font-sans text-body-lg text-mute">
            Ссылка могла устареть или ты попал сюда случайно. Возвращайся на
            главную — там мы оставили всё важное про аренду ВОЛЬТ U2.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="rounded-md bg-volt px-6 py-4 font-mono text-caption uppercase text-ink transition-colors duration-quick ease-out-soft hover:bg-volt-hover"
            >
              На главную →
            </Link>
            <Link
              href="/#tariffs"
              className="rounded-md border border-[var(--line-strong)] px-6 py-4 font-mono text-caption uppercase transition-colors duration-quick ease-out-soft hover:border-volt hover:text-volt"
            >
              Смотреть тарифы
            </Link>
          </div>
        </div>

        {/* Низ — техническая подпись */}
        <footer className="flex flex-col items-start justify-between gap-2 border-t border-[var(--line)] pt-6 font-mono text-caption uppercase tracking-[0.08em] text-mute md:flex-row md:items-center">
          <span>© 2026 Вольтаренда · Санкт‑Петербург</span>
          <a
            href="tel:+79013000319"
            className="tnum transition-colors duration-quick ease-out-soft hover:text-volt"
          >
            +7 (901) 300-03-19
          </a>
        </footer>
      </div>
    </main>
  );
}
