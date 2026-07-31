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
      {/* Соцвход — сверху, как принято */}
      {anySocial && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {social.vk && (
              <SocialCard href="/api/auth/vk" label="VK" badge={<Badge bg="#0077FF">VK</Badge>} />
            )}
            {social.yandex && (
              <SocialCard href="/api/auth/yandex" label="Яндекс" badge={<Badge bg="#FC3F1D">Я</Badge>} />
            )}
          </div>
          {social.telegram && (
            <div className="flex justify-center pt-1">
              <TelegramWidget bot={social.telegramBot} />
            </div>
          )}

          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--line)]" />
            <span className="font-mono text-caption uppercase text-mute">или</span>
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

// Карточка соцвхода — бордер + бренд-бейдж + подпись (как Google/Github).
function SocialCard({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2.5 rounded-2xl border border-[var(--line-strong)] bg-[var(--bg-2)] px-4 py-3.5 text-body font-medium text-[var(--text)] transition-colors duration-quick hover:border-[var(--text)] hover:bg-[var(--bg)]"
    >
      {badge}
      {label}
    </a>
  );
}

function Badge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

// Официальный виджет входа Telegram (грузит скрипт telegram.org). Требует
// /setdomain у BotFather на домен сайта.
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
    s.setAttribute("data-radius", "16");
    s.setAttribute("data-auth-url", "/api/auth/telegram/widget");
    s.setAttribute("data-request-access", "write");
    el.appendChild(s);
    return () => {
      el.innerHTML = "";
    };
  }, [bot]);
  return <div ref={ref} className="flex min-h-[48px] justify-center" />;
}
