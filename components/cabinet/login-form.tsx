"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/auth/actions";
import { AuthShell, Field, SubmitButton, FormError } from "./ui";

const initial: ActionState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

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
    </AuthShell>
  );
}
