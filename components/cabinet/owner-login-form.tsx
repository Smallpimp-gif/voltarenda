"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/auth/actions";
import { AuthShell, Field, SubmitButton, FormError } from "./ui";

const initial: ActionState = { error: null };

export function OwnerLoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <AuthShell
      title="Вход владельца"
      subtitle="Кабинет владельца Вольтаренды."
      footer={
        <>
          Первый вход?{" "}
          <Link href="/cabinet/owner/register" className="text-[var(--text)] underline">
            Создать доступ
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
