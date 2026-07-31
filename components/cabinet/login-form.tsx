"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/auth/actions";
import { AuthShell, Field, SubmitButton, FormError } from "./ui";

const initial: ActionState = { error: null };

export type SocialConfig = {
  vk: boolean;
  yandex: boolean;
  telegram: boolean;
  telegramBotId: string;
};

export function LoginForm({ social }: { social: SocialConfig }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [entering, setEntering] = useState(false);
  const anySocial = social.vk || social.yandex || social.telegram;

  // Открыт ВНУТРИ Telegram (Mini App) → моментальный вход по initData, без
  // кнопок и ввода номера. В обычном браузере initData пуст — идём обычным
  // путём (форма + виджет).
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

  // Telegram-вход полным редиректом на oauth.telegram.org (без попапа —
  // попап виснет на мобильных). На телефоне открывает приложение Telegram,
  // после подтверждения возвращает на наш колбэк. На десктопе без сессии
  // Telegram Web — форма Telegram (его флоу). Работает без бот-сервера.
  // Вход БЕЗ номера по deep-link готов в /api/auth/tg-* + bot/index.mjs —
  // включим, когда обновим бота на сервере.
  const telegramLogin = useCallback(() => {
    const origin = window.location.origin;
    const p = new URLSearchParams({
      bot_id: social.telegramBotId,
      origin,
      request_access: "write",
      return_to: `${origin}/api/auth/telegram/widget`,
    });
    window.location.href = `https://oauth.telegram.org/auth?${p.toString()}`;
  }, [social.telegramBotId]);

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
          <div className="grid grid-cols-3 gap-2.5">
            {social.telegram && (
              <SocialTile as="button" onClick={telegramLogin} label="Telegram" icon={<TelegramIcon />} />
            )}
            {social.vk && (
              <SocialTile as="a" href="/api/auth/vk" label="ВКонтакте" icon={<VkIcon />} />
            )}
            {social.yandex && (
              <SocialTile as="a" href="/api/auth/yandex" label="Яндекс" icon={<YandexIcon />} />
            )}
          </div>
        </div>
      )}
    </AuthShell>
  );
}

// Одинаковая плитка соцвхода: иконка сверху, подпись снизу. Нейтральный фон,
// подсветка на hover, лёгкий press на active.
function SocialTile({
  as,
  href,
  onClick,
  label,
  icon,
}: {
  as: "a" | "button";
  href?: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  const cls =
    "flex flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] py-4 text-caption font-medium text-mute transition-all duration-quick hover:border-[var(--line-strong)] hover:bg-[var(--bg)] hover:text-[var(--text)] active:translate-y-px";
  const inner = (
    <>
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      {label}
    </>
  );
  if (as === "button") {
    return (
      <button type="button" onClick={onClick} aria-label={`Войти через ${label}`} className={cls}>
        {inner}
      </button>
    );
  }
  return (
    <a href={href} aria-label={`Войти через ${label}`} className={cls}>
      {inner}
    </a>
  );
}

// --- Бренд-иконки (24px, фирменные цвета) -----------------------------

function VkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#0077FF" aria-hidden>
      <path d="M13.16 18.94c-6.84 0-10.98-4.75-11.16-12.66h3.43c.12 5.8 2.72 8.26 4.72 8.76V6.28h3.24v4.94c1.98-.21 4.06-2.48 4.76-4.94h3.24c-.54 3.03-2.8 5.3-4.42 6.24 1.62.76 4.18 2.74 5.16 6.42h-3.56c-.76-2.38-2.68-4.22-5.18-4.46v4.46h-.47z" />
    </svg>
  );
}

function YandexIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
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

function TelegramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#229ED9" aria-hidden>
      <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" />
      <path
        fill="#fff"
        d="M5.49 11.86c3.5-1.52 5.83-2.53 6.99-3.02 3.33-1.39 4.02-1.63 4.47-1.64.1 0 .32.02.47.14.12.1.16.24.17.34.02.1.04.31.02.48-.18 1.9-.96 6.5-1.36 8.63-.17.9-.5 1.2-.82 1.23-.7.07-1.23-.46-1.9-.9-1.06-.7-1.65-1.13-2.68-1.81-1.19-.78-.42-1.21.26-1.91.18-.18 3.25-2.98 3.31-3.23.01-.03.01-.15-.06-.21s-.17-.04-.24-.02c-.1.02-1.75 1.11-4.94 3.27-.47.32-.89.48-1.27.47-.42-.01-1.22-.24-1.82-.43-.73-.24-1.32-.36-1.26-.77.03-.21.33-.43.87-.66z"
      />
    </svg>
  );
}
