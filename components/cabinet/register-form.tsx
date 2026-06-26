"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/auth/actions";
import { AuthShell, Field, SubmitButton, FormError } from "./ui";

const initial: ActionState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <AuthShell
      title="Регистрация"
      subtitle="Укажите номер договора и фамилию из договора — найдём вашу запись и создадим кабинет."
      footer={
        <>
          Уже есть кабинет?{" "}
          <Link href="/cabinet/login" className="text-[var(--text)] underline">
            Войти
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <FormError error={state.error} />
        <Field
          label="Номер договора"
          name="contract"
          placeholder="01/2026"
          autoComplete="off"
        />
        <Field label="Фамилия" name="surname" placeholder="Иванов" autoComplete="family-name" />
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
          autoComplete="new-password"
          placeholder="не короче 8 символов"
        />
        <SubmitButton pending={pending}>Создать кабинет</SubmitButton>
      </form>
    </AuthShell>
  );
}
