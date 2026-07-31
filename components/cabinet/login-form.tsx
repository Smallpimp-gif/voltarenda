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
          <Link href="/cabinet/register" className="text-[var(--text)] underline">
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
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--line)]" />
            <span className="font-mono text-caption uppercase text-mute">или</span>
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>
          <div className="flex flex-col gap-2.5">
            {social.vk && (
              <SocialLink href="/api/auth/vk" label="Войти через VK" color="#0077FF" />
            )}
            {social.yandex && (
              <SocialLink href="/api/auth/yandex" label="Войти через Яндекс" color="#FC3F1D" />
            )}
            {social.telegram && <TelegramWidget bot={social.telegramBot} />}
          </div>
        </>
      )}
    </AuthShell>
  );
}

function SocialLink({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 rounded-pill px-5 py-3 text-caption font-semibold text-white transition-opacity duration-quick hover:opacity-90 active:scale-[0.99]"
      style={{ backgroundColor: color }}
    >
      {label}
    </a>
  );
}

// Официальный виджет входа Telegram (грузит скрипт telegram.org и рисует
// кнопку). Требует /setdomain у BotFather на домен сайта.
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
    s.setAttribute("data-radius", "20");
    s.setAttribute("data-auth-url", "/api/auth/telegram/widget");
    s.setAttribute("data-request-access", "write");
    el.appendChild(s);
    return () => {
      el.innerHTML = "";
    };
  }, [bot]);
  return <div ref={ref} className="flex justify-center" />;
}
