"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  addTenantAction,
  updateTenantAction,
  type ActionState,
} from "@/lib/auth/owner-actions";
import type { Tenant } from "@/lib/schedule";

const initial: ActionState = { error: null };

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-caption uppercase text-mute">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 text-body text-[var(--text)] outline-none transition-colors duration-quick focus:border-volt";

export function TenantForm({ tenant }: { tenant?: Tenant }) {
  const isEdit = Boolean(tenant);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateTenantAction : addTenantAction,
    initial,
  );
  const [type, setType] = useState<string>(tenant?.type ?? "аренда");

  return (
    <form
      action={formAction}
      className="rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-5"
    >
      {isEdit && <input type="hidden" name="id" value={tenant!.id} />}
      <h3 className="font-mono text-caption uppercase text-mute">
        {isEdit ? `Редактировать · ${tenant!.name}` : "Новый арендатор"}
      </h3>

      {state.error && (
        <p role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-body text-danger">
          {state.error}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Labeled label="Фамилия">
          <input name="name" defaultValue={tenant?.name} required className={inputCls} placeholder="Иванов" />
        </Labeled>
        <Labeled label="Номер договора">
          <input name="contract" defaultValue={tenant?.contract} required className={inputCls} placeholder="03/2026" />
        </Labeled>
        <Labeled label="Тип">
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputCls}
          >
            <option value="аренда">Аренда</option>
            <option value="выкуп">Выкуп</option>
          </select>
        </Labeled>
        <Labeled label="Недельный платёж, ₽">
          <input
            name="weekly"
            type="number"
            min={1}
            defaultValue={tenant?.weekly}
            required
            className={inputCls}
            placeholder="5500"
          />
        </Labeled>
        <Labeled label="Дата заезда">
          <input name="startDate" type="date" defaultValue={tenant?.startDate} required className={inputCls} />
        </Labeled>
        {type === "выкуп" && (
          <Labeled label="Недель выкупа">
            <input
              name="buyoutWeeks"
              type="number"
              min={1}
              defaultValue={tenant?.buyoutWeeks ?? undefined}
              required
              className={inputCls}
              placeholder="36"
            />
          </Labeled>
        )}
        <Labeled label="Telegram (необязательно)">
          <input
            name="telegramUsername"
            defaultValue={tenant?.telegramUsername}
            className={inputCls}
            placeholder="username"
          />
        </Labeled>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-pill bg-volt px-5 py-2.5 font-mono text-caption uppercase text-ink transition-colors duration-quick hover:bg-volt-hover disabled:opacity-60"
        >
          {pending ? "Сохранение…" : isEdit ? "Сохранить" : "Добавить"}
        </button>
        <Link
          href="/cabinet/owner"
          className="font-mono text-caption uppercase text-mute transition-colors duration-quick hover:text-[var(--text)]"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
