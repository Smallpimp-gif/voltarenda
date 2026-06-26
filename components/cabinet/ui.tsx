// Общие примитивы форм кабинета — в стиле сайта (токены volt/ink/mute,
// радиус md, font-mono caption у лейблов).

import type { ReactNode } from "react";

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  inputMode?: "text" | "email" | "numeric";
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-caption uppercase text-mute">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        inputMode={inputMode}
        className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-2)] px-4 py-3 text-body text-[var(--text)] outline-none transition-colors duration-quick placeholder:text-mute focus:border-volt"
      />
    </label>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 inline-flex items-center justify-center rounded-pill bg-volt px-6 py-3 font-mono text-caption uppercase text-ink transition-colors duration-quick hover:bg-volt-hover disabled:opacity-60"
    >
      {pending ? "Подождите…" : children}
    </button>
  );
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-body text-danger"
    >
      {error}
    </p>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-gutter py-16">
      <a
        href="/"
        className="mb-10 inline-block font-mono text-caption uppercase text-mute transition-colors duration-quick hover:text-[var(--text)]"
      >
        ← Вольтаренда
      </a>
      <h1 className="text-h2 text-[var(--text)]">{title}</h1>
      {subtitle && <p className="mt-3 text-body text-mute">{subtitle}</p>}
      <div className="mt-8">{children}</div>
      {footer && <div className="mt-8 text-body text-mute">{footer}</div>}
    </div>
  );
}
