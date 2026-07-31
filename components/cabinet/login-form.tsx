"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/auth/actions";
import { AuthShell, Field, SubmitButton, FormError } from "./ui";

const initial: ActionState = { error: null };

export type SocialConfig = {
  vk: boolean;
  yandex: boolean;
  telegram: boolean;
  telegramBot: string;
};

export function LoginForm({ social }: { social: SocialConfig }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const anySocial = social.vk || social.yandex || social.telegram;

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
      {anySocial && (
        <div className="mb-7">
          {(social.vk || social.yandex) && (
            <div className="grid grid-cols-2 gap-2.5">
              {social.vk && (
                <SocialButton href="/api/auth/vk" label="ВКонтакте" icon={<VkIcon />} />
              )}
              {social.yandex && (
                <SocialButton href="/api/auth/yandex" label="Яндекс" icon={<YandexIcon />} />
              )}
            </div>
          )}
          {social.telegram && (
            <div className="mt-2.5">
              <TelegramWidget bot={social.telegramBot} />
            </div>
          )}

          <div className="mt-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-[var(--line)]" />
            <span className="font-mono text-caption uppercase tracking-wide text-mute">
              или по почте
            </span>
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>
        </div>
      )}

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
    </AuthShell>
  );
}

// Обведённая кнопка соцвхода: бренд-иконка слева, подпись. Нейтральный фон,
// подсветка на hover, лёгкий physical-press на active.
function SocialButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group flex h-[52px] items-center justify-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] text-body font-medium text-[var(--text)] transition-all duration-quick hover:border-[var(--line-strong)] hover:bg-[var(--bg)] active:translate-y-px"
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </a>
  );
}

// --- Бренд-иконки (моно-размер 20px, фирменные цвета) ------------------

function VkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077FF" aria-hidden>
      <path d="M13.16 18.94c-6.84 0-10.74-4.69-10.9-12.5h3.43c.11 5.73 2.64 8.16 4.64 8.66V6.44h3.23v4.94c1.98-.21 4.06-2.46 4.76-4.94h3.23c-.54 3.05-2.79 5.3-4.39 6.23 1.6.75 4.16 2.71 5.13 6.27h-3.55c-.76-2.37-2.66-4.2-5.18-4.45v4.45h-.39z" />
    </svg>
  );
}

function YandexIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
      <path
        d="M13.3 6.7h-1.13c-1.7 0-3.02 1.02-3.02 3.02 0 1.36.6 2.16 1.77 2.95l-2.02 4.63h1.85l1.85-4.4v4.4h1.63V6.7h-.93zm-.7 6.9l-.86.2c-.86-.6-1.16-1.06-1.16-2.06 0-1.1.5-1.62 1.36-1.62h.66v3.48z"
        fill="#fff"
      />
    </svg>
  );
}

// Официальный виджет входа Telegram (грузит скрипт telegram.org, требует
// /setdomain у BotFather). Рендерит собственную кнопку.
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
  return <div ref={ref} className="flex min-h-[48px] items-center justify-center [&_iframe]:!w-full" />;
}
