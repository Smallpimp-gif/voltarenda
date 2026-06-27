"use client";

// Точка входа Telegram Mini App (открывается из @voltarenda_bot).
// Грузит Telegram WebApp SDK, берёт initData, авторизует через
// /api/auth/telegram и роутит:
//   владелец → /cabinet/owner, арендатор → /cabinet,
//   новый человек → экран «оформить / войти по договору».
// Вне Telegram (локально) работает через серверный TG_MOCK.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApply } from "@/components/apply";

type State = "loading" | "new" | "invalid" | "error";

export default function MiniApp() {
  const { open } = useApply();
  const [state, setState] = useState<State>("loading");
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadTelegramSdk();
      const wa = (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
      try {
        wa?.ready?.();
        wa?.expand?.();
      } catch {
        /* не в Telegram — ок, есть dev-мок на сервере */
      }
      const initData = wa?.initData ?? "";

      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (data.status === "owner" || data.status === "tenant" || data.status === "user") {
          window.location.replace(data.redirect);
          return;
        }
        if (data.status === "new") {
          if (data.tg?.id) {
            try {
              sessionStorage.setItem("tg_id", String(data.tg.id));
              sessionStorage.setItem("tg_name", data.tg.name || "");
            } catch {
              /* sessionStorage недоступен — не критично */
            }
          }
          setName(data.tg?.name || "");
          setState("new");
          return;
        }
        setState("invalid");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") return <Centered>Входим…</Centered>;
  if (state === "invalid")
    return <Centered>Откройте приложение через бота @voltarenda_bot.</Centered>;
  if (state === "error")
    return <Centered>Не удалось войти. Попробуйте ещё раз.</Centered>;

  // Новый человек.
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-gutter py-16">
      <div>
        <span className="font-mono text-caption uppercase text-mute">Вольтаренда</span>
        <h1 className="mt-3 font-sans text-display-2 leading-none tracking-tight">
          {name ? `Привет, ${name.split(" ")[0]}` : "Привет"}
        </h1>
        <p className="mt-4 text-body-lg text-mute">
          Выбери велосипед и оформи аренду за пару минут. Или войди, если у тебя
          уже есть договор.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => open()}
          className="rounded-md bg-volt px-8 py-5 font-mono text-caption uppercase text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-[0.98]"
        >
          Оформить аренду →
        </button>
        <Link
          href="/cabinet/register"
          className="rounded-md border border-[var(--line-strong)] px-8 py-5 text-center font-mono text-caption uppercase text-mute transition-colors duration-quick hover:text-[var(--text)]"
        >
          У меня есть договор
        </Link>
        <SupportLink />
      </div>
    </main>
  );
}

const SUPPORT_URL = "https://t.me/voltarenda_bike";

function SupportLink() {
  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 text-center font-mono text-caption uppercase text-mute underline-offset-2 transition-colors duration-quick hover:text-[var(--text)] hover:underline"
    >
      Связаться с поддержкой
    </a>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-gutter text-center">
      <p className="text-body-lg text-mute">{children}</p>
      <SupportLink />
    </main>
  );
}

type TgWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};

function loadTelegramSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    const w = window as unknown as { Telegram?: { WebApp?: unknown } };
    if (w.Telegram?.WebApp) return resolve();
    const existing = document.querySelector<HTMLScriptElement>("script[data-tg-sdk]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      // на случай если уже загружен
      setTimeout(resolve, 1500);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-web-app.js";
    s.async = true;
    s.dataset.tgSdk = "1";
    s.onload = () => resolve();
    s.onerror = () => resolve(); // без SDK тоже продолжаем (dev-мок на сервере)
    document.head.appendChild(s);
  });
}
