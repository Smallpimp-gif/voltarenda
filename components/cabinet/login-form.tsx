"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/auth/actions";
import { AuthShell, Field, SubmitButton, FormError } from "./ui";

const initial: ActionState = { error: null };

export type SocialConfig = {
  vk: boolean;
  yandex: boolean;
  telegram: boolean;
  telegramBot: string; // username бота (для официального виджета)
};

export function LoginForm({ social }: { social: SocialConfig }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [entering, setEntering] = useState(false);
  const anySocial = social.vk || social.yandex || social.telegram;

  // Открыт ВНУТРИ Telegram (Mini App) → моментальный вход по initData, без
  // кнопок и ввода номера. В обычном браузере initData пуст — обычный путь.
  useEffect(() => {
    const wa = (window as unknown as { Telegram?: { WebApp?: { initData?: string; ready?: () => void } } })
      .Telegram?.WebApp;
    const initData = wa?.initData;
    if (!initData) return;
    setEntering(true);
    try {
      wa?.ready?.();
    } catch {
      /* не в Telegram — ок */
    }
    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    })
      .then((r) => r.json())
      .then((d: { redirect?: string }) => {
        if (d?.redirect) window.location.replace(d.redirect);
        else setEntering(false);
      })
      .catch(() => setEntering(false));
  }, []);

  if (entering) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-gutter">
        <p className="font-mono text-caption uppercase text-mute">Входим…</p>
      </div>
    );
  }

  return (
    <AuthShell
      title="Вход в кабинет"
      subtitle="Личный кабинет арендатора Вольтаренды."
      footer={
        <>
          Нет кабинета?{" "}
          <Link href="/cabinet/register" className="text-[var(--text)] underline underline-offset-2">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <FormError error={state.error} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
        <Field
          label="Пароль"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <SubmitButton pending={pending}>Войти</SubmitButton>
      </form>

      {anySocial && (
        <div className="mt-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-[var(--line)]" />
            <span className="font-mono text-caption uppercase text-mute">или</span>
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>

          {social.telegram && (
            <div className="mb-2.5 flex justify-center">
              <TelegramWidget bot={social.telegramBot} />
            </div>
          )}

          {(social.vk || social.yandex) && (
            <div className="grid grid-cols-2 gap-2.5">
              {social.vk && (
                <SocialTile href="/api/auth/vk" label="ВКонтакте" icon={<VkIcon />} />
              )}
              {social.yandex && (
                <SocialTile href="/api/auth/yandex" label="Яндекс" icon={<YandexIcon />} />
              )}
            </div>
          )}
        </div>
      )}
    </AuthShell>
  );
}

// Плитка соцвхода (VK/Яндекс): иконка + подпись, нейтральный фон, hover/press.
function SocialTile({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={`Войти через ${label}`}
      className="flex items-center justify-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] py-3.5 text-body font-medium text-[var(--text)] transition-all duration-quick hover:border-[var(--line-strong)] hover:bg-[var(--bg)] active:translate-y-px"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </a>
  );
}

// Официальный виджет входа Telegram (надёжно работает на десктопе и мобильном:
// на телефоне открывает приложение, на десктопе — страница Telegram). Рендерит
// собственную кнопку. Требует /setdomain у BotFather на домен сайта.
function TelegramWidget({ bot }: { bot: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !bot) return;
    el.innerHTML = "";
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", bot);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "12");
    s.setAttribute("data-auth-url", "/api/auth/telegram/widget");
    s.setAttribute("data-request-access", "write");
    el.appendChild(s);
    return () => {
      el.innerHTML = "";
    };
  }, [bot]);
  return <div ref={ref} className="flex min-h-[48px] items-center justify-center" />;
}

// --- Бренд-иконки (фирменные цвета) -----------------------------------

function VkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077FF" aria-hidden>
      <path d="M13.16 18.94c-6.84 0-10.98-4.75-11.16-12.66h3.43c.12 5.8 2.72 8.26 4.72 8.76V6.28h3.24v4.94c1.98-.21 4.06-2.48 4.76-4.94h3.24c-.54 3.03-2.8 5.3-4.42 6.24 1.62.76 4.18 2.74 5.16 6.42h-3.56c-.76-2.38-2.68-4.22-5.18-4.46v4.46h-.47z" />
    </svg>
  );
}

function YandexIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
      <text
        x="12"
        y="17.2"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="#fff"
      >
        Я
      </text>
    </svg>
  );
}
