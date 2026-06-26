"use client";

import { useActionState } from "react";
import { setBikesAction, type ActionState } from "@/lib/auth/owner-actions";

const initial: ActionState = { error: null };

// Редактируемое число свободных велосипедов (видно на сайте, бейдж в hero).
// variant "metric" — ячейка полосы метрик (без коробки, крупное число).
// variant "card"   — отдельная карточка (вкладка «Настройки» на мобильном).
export function BikesForm({
  current,
  variant = "card",
}: {
  current: number;
  variant?: "metric" | "card";
}) {
  const [state, formAction, pending] = useActionState(setBikesAction, initial);

  const okBtn = (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-volt px-3.5 py-1.5 font-mono text-caption uppercase text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95 disabled:opacity-60"
    >
      {pending ? "…" : "OK"}
    </button>
  );

  if (variant === "metric") {
    return (
      <form
        action={formAction}
        className="flex min-h-[172px] flex-col justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6"
      >
        <span className="font-mono text-caption uppercase text-mute">Свободно велосипедов</span>
        <div>
          <div className="flex items-end gap-2">
            <input
              name="availableBikes"
              type="number"
              min={0}
              defaultValue={current}
              aria-label="Свободно велосипедов"
              className="w-[2.2ch] border-0 border-b-2 border-[var(--line-strong)] bg-transparent p-0 pb-1 font-sans text-display-2 leading-none tabular-nums text-[var(--text)] outline-none focus:border-volt"
            />
            {okBtn}
            {state.ok && <span className="pb-2 font-mono text-caption uppercase text-mute">✓</span>}
          </div>
          <span className="mt-3 block font-mono text-caption uppercase text-mute">видно на сайте</span>
          {state.error && <span className="mt-1 block text-caption text-danger">{state.error}</span>}
        </div>
      </form>
    );
  }

  return (
    <form action={formAction} className="flex flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
      <span className="font-mono text-caption uppercase text-mute">Свободно велосипедов</span>
      <div className="mt-3 flex items-end gap-2">
        <input
          name="availableBikes"
          type="number"
          min={0}
          defaultValue={current}
          aria-label="Свободно велосипедов"
          className="w-20 border-0 border-b-2 border-[var(--line-strong)] bg-transparent p-0 pb-1 font-sans text-h2 font-semibold tabular-nums text-[var(--text)] outline-none focus:border-volt"
        />
        {okBtn}
        {state.ok && <span className="pb-2 font-mono text-caption uppercase text-mute">✓</span>}
      </div>
      <span className="mt-2 font-mono text-caption uppercase text-mute">видно на сайте</span>
      {state.error && <span className="mt-1 text-caption text-danger">{state.error}</span>}
    </form>
  );
}
