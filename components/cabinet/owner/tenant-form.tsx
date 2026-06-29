"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  addTenantAction,
  updateTenantAction,
  type ActionState,
} from "@/lib/auth/owner-actions";
import type { Tenant, TenantPosition } from "@/lib/schedule";

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
      <span className="text-caption font-medium text-mute">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 text-body text-[var(--text)] outline-none transition-colors duration-quick focus:border-volt";

export function TenantForm({
  tenant,
  paidThrough,
}: {
  tenant?: Tenant;
  paidThrough?: number;
}) {
  const isEdit = Boolean(tenant);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateTenantAction : addTenantAction,
    initial,
  );
  const [type, setType] = useState<string>(tenant?.type ?? "аренда");
  const [positions, setPositions] = useState<TenantPosition[]>(
    tenant?.positions ?? [],
  );

  const addPos = () =>
    setPositions((p) => [
      ...p,
      { name: "", cost: 0, weekly: 0, intoBuyout: type === "выкуп" },
    ]);
  const updPos = (i: number, patch: Partial<TenantPosition>) =>
    setPositions((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const delPos = (i: number) =>
    setPositions((p) => p.filter((_, j) => j !== i));

  return (
    <form
      action={formAction}
      className="rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)] p-5"
    >
      {isEdit && <input type="hidden" name="id" value={tenant!.id} />}
      <input
        type="hidden"
        name="positions"
        value={JSON.stringify(positions.filter((p) => p.name.trim()))}
      />
      <h3 className="text-body-lg font-medium text-[var(--text)]">
        {isEdit ? `Редактировать · ${tenant!.name}` : "Новый арендатор"}
      </h3>

      {state.error && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-body text-danger">
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
        {isEdit && (
          <Labeled label="Внесено выплат">
            <input
              name="paidThrough"
              type="number"
              min={0}
              defaultValue={paidThrough ?? 0}
              className={inputCls}
              placeholder="0"
            />
          </Labeled>
        )}
        <Labeled label="Залог, ₽">
          <input
            name="deposit"
            type="number"
            min={0}
            defaultValue={tenant?.deposit ?? 5000}
            className={inputCls}
            placeholder="5000"
          />
        </Labeled>
        <Labeled label="Telegram (необязательно)">
          <input
            name="telegramUsername"
            defaultValue={tenant?.telegramUsername}
            className={inputCls}
            placeholder="username"
          />
        </Labeled>
      </div>

      {/* Доп. позиции */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-medium text-mute">Доп. позиции (например, второй АКБ)</p>
          <button
            type="button"
            onClick={addPos}
            className="rounded-pill border border-[var(--line-strong)] px-3 py-1.5 text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
          >
            + Позиция
          </button>
        </div>

        {positions.length === 0 ? (
          <p className="mt-2 text-caption text-mute">
            Можно добавить позже: название, стоимость и прибавку к недельному платежу.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {positions.map((p, i) => (
              <div key={i} className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    placeholder="Название (АКБ 60/60)"
                    value={p.name}
                    onChange={(e) => updPos(i, { name: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Стоимость, ₽"
                    value={p.cost || ""}
                    onChange={(e) => updPos(i, { cost: Number(e.target.value) || 0 })}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="+ к недельному, ₽"
                    value={p.weekly || ""}
                    onChange={(e) => updPos(i, { weekly: Number(e.target.value) || 0 })}
                    className={inputCls}
                  />
                  <label className="flex items-center gap-2 px-1 text-body text-[var(--text)]">
                    <input
                      type="checkbox"
                      checked={p.intoBuyout}
                      onChange={(e) => updPos(i, { intoBuyout: e.target.checked })}
                      className="h-4 w-4 accent-volt"
                    />
                    Идёт в выкуп
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => delPos(i)}
                  className="mt-2 text-caption text-mute transition-colors duration-quick hover:text-danger"
                >
                  Удалить позицию
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-pill bg-volt px-5 py-2.5 text-caption font-semibold text-ink transition-colors duration-quick hover:bg-volt-hover disabled:opacity-60"
        >
          {pending ? "Сохранение…" : isEdit ? "Сохранить" : "Добавить"}
        </button>
        <Link
          href="/cabinet/owner"
          className="text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
