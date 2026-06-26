"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerOwnerAction, type ActionState } from "@/lib/auth/actions";
import { AuthShell, Field, SubmitButton, FormError } from "./ui";

const initial: ActionState = { error: null };

export function OwnerRegisterForm() {
  const [state, formAction, pending] = useActionState(registerOwnerAction, initial);

  return (
    <AuthShell
      title="Доступ владельца"
      subtitle="Email должен быть в списке владельцев (OWNER_EMAILS). Задайте пароль для входа в админку."
      footer={
        <>
          Уже есть доступ?{" "}
          <Link href="/cabinet/owner/login" className="text-[var(--text)] underline">
            Войти
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
          autoComplete="new-password"
          placeholder="не короче 8 символов"
        />
        <SubmitButton pending={pending}>Создать доступ</SubmitButton>
      </form>
    </AuthShell>
  );
}
