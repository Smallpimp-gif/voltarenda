"use client";

// Вкладка «Закупки»: поштучный учёт товара с расчётом прибыли. Закупка — не
// расход: деньги вернутся с продажей. Продавать можно частями, остаток
// показывает, сколько денег «висит» в непроданном товаре.

import { useState } from "react";
import {
  addPurchaseAction,
  addSaleAction,
  editPurchaseAction,
  deletePurchaseAction,
  deleteSaleAction,
} from "@/lib/auth/owner-actions";

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const money = (n: number) => `${rub.format(Math.round(n * 100) / 100)} ₽`;
const dtFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "numeric",
  month: "long",
});

const GREEN = "#16a34a";
const RED = "#ef4444";

export type SaleRow = {
  id: string;
  at: string;
  qty: number;
  revenue: number;
  note?: string;
};

export type PurchaseRow = {
  id: string;
  name: string;
  at: string;
  qty: number;
  unitCost: number;
  delivery: number;
  invested: number;
  costPerUnit: number;
  soldQty: number;
  revenue: number;
  profit: number;
  remainingQty: number;
  tiedValue: number;
  sales: SaleRow[];
};

export type PurchasesSummaryRow = {
  invested: number;
  revenue: number;
  profit: number;
  tiedValue: number;
  itemsOnHand: number;
};

export function PurchasesPanel({
  rows,
  summary,
}: {
  rows: PurchaseRow[];
  summary: PurchasesSummaryRow;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-medium text-mute">Прибыль с продаж</p>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-md border border-[var(--line-strong)] px-4 py-2 text-caption font-medium text-[var(--text)] transition-colors duration-quick hover:border-volt"
            >
              + Закупка
            </button>
          )}
        </div>

        <p
          className="mt-1.5 font-sans text-display-2 leading-none tracking-tight tabular-nums"
          style={{ color: summary.profit < 0 ? RED : summary.profit > 0 ? GREEN : "var(--text)" }}
        >
          {summary.profit < 0 ? "−" : summary.profit > 0 ? "+" : ""}
          {money(summary.profit)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill label="Вложено" value={money(summary.invested)} />
          <Pill label="Выручка" value={money(summary.revenue)} />
          <Pill label="В товаре" value={money(summary.tiedValue)} />
          <Pill label="Остаток" value={`${summary.itemsOnHand} шт`} />
        </div>

        {adding && <PurchaseForm onDone={() => setAdding(false)} />}
      </div>

      {rows.length > 0 && (
        <div className="border-t border-[var(--line)]">
          {rows.map((p) => (
            <PurchaseCard key={p.id} p={p} />
          ))}
        </div>
      )}
      {rows.length === 0 && !adding && (
        <div className="border-t border-[var(--line)] px-5 py-6">
          <p className="text-caption text-mute">
            Закупок пока нет. Нажмите «+ Закупка» — учтём себестоимость и
            посчитаем прибыль с продаж.
          </p>
        </div>
      )}
    </div>
  );
}

function PurchaseCard({ p }: { p: PurchaseRow }) {
  const [selling, setSelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const nothingSold = p.soldQty === 0;

  function handleDeletePurchase() {
    if (!confirm(`Удалить закупку «${p.name}» со всеми продажами?`)) return;
    const fd = new FormData();
    fd.set("id", p.id);
    void deletePurchaseAction(fd);
  }

  if (editing) {
    return (
      <div className="border-b border-[var(--line)] px-5 py-4 last:border-0">
        <PurchaseForm row={p} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--line)] px-5 py-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body text-[var(--text)]">{p.name}</p>
          <p className="mt-0.5 text-caption text-mute">
            {dtFmt.format(new Date(p.at))} · {p.qty} шт по {money(p.unitCost)}
            {p.delivery > 0 ? ` · доставка ${money(p.delivery)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="font-sans text-body font-semibold tabular-nums"
            style={{ color: nothingSold ? "var(--text-mute,#9B9890)" : p.profit < 0 ? RED : GREEN }}
          >
            {nothingSold ? "—" : `${p.profit < 0 ? "−" : "+"}${money(p.profit)}`}
          </p>
          <p className="mt-0.5 text-caption text-mute">прибыль</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Pill label="Вложено" value={money(p.invested)} small />
        <Pill label="Продано" value={`${p.soldQty}/${p.qty} шт`} small />
        {p.remainingQty > 0 && <Pill label="Остаток" value={`${p.remainingQty} шт`} small />}
        {p.revenue > 0 && <Pill label="Выручка" value={money(p.revenue)} small />}
      </div>

      {/* Продажи */}
      {p.sales.length > 0 && (
        <div className="mt-3 rounded-md border border-[var(--line)]">
          {p.sales.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 border-b border-[var(--line)] px-3 py-2 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption text-[var(--text)]">
                  {s.qty} шт → {money(s.revenue)}
                  {s.note ? ` · ${s.note}` : ""}
                </p>
                <p className="text-caption text-mute">{dtFmt.format(new Date(s.at))}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!confirm("Удалить эту продажу?")) return;
                  const fd = new FormData();
                  fd.set("purchaseId", p.id);
                  fd.set("saleId", s.id);
                  void deleteSaleAction(fd);
                }}
                aria-label="Удалить продажу"
                className="shrink-0 text-mute transition-colors duration-quick hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {selling ? (
        <SaleForm purchase={p} onDone={() => setSelling(false)} />
      ) : (
        <div className="mt-3 flex items-center gap-3">
          {p.remainingQty > 0 && (
            <button
              type="button"
              onClick={() => setSelling(true)}
              className="rounded-pill bg-volt px-4 py-2 text-caption font-medium text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
            >
              + Продажа
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
          >
            Изменить
          </button>
          <button
            type="button"
            onClick={handleDeletePurchase}
            className="ml-auto text-caption font-medium text-mute transition-colors duration-quick hover:text-danger"
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}

// Форма закупки — создание (row не задан) или правка.
function PurchaseForm({ row, onDone }: { row?: PurchaseRow; onDone: () => void }) {
  const editing = Boolean(row);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onDone();
        void (editing ? editPurchaseAction(fd) : addPurchaseAction(fd));
      }}
      className="mt-4 rounded-md border border-[var(--line-strong)] p-4"
    >
      {editing && <input type="hidden" name="id" value={row!.id} />}
      <input
        name="name"
        type="text"
        maxLength={80}
        autoFocus
        required
        defaultValue={row?.name ?? ""}
        placeholder="Что закупили (напр. АКБ 48V)"
        className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 text-body text-[var(--text)] outline-none placeholder:text-[var(--line-strong)] focus:border-volt"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Field name="qty" label="Кол-во, шт" defaultValue={row?.qty} step="1" min="1" />
        <Field name="unitCost" label="Цена/шт, ₽" defaultValue={row?.unitCost} step="0.01" min="0" />
        <Field name="delivery" label="Доставка, ₽" defaultValue={row?.delivery ?? 0} step="0.01" min="0" />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-pill bg-volt px-5 py-2.5 text-caption font-medium text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
        >
          {editing ? "Сохранить" : "Добавить закупку"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function SaleForm({ purchase, onDone }: { purchase: PurchaseRow; onDone: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onDone();
        void addSaleAction(fd);
      }}
      className="mt-3 rounded-md border border-volt p-4"
    >
      <input type="hidden" name="purchaseId" value={purchase.id} />
      <div className="grid grid-cols-2 gap-2">
        <Field name="qty" label={`Продано, шт (до ${purchase.remainingQty})`} step="1" min="1" max={String(purchase.remainingQty)} defaultValue={undefined} />
        <Field name="revenue" label="Выручка, ₽" step="0.01" min="0" defaultValue={undefined} />
      </div>
      <input
        name="note"
        type="text"
        maxLength={120}
        placeholder="Комментарий (необязательно)"
        className="mt-3 w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 text-body text-[var(--text)] outline-none placeholder:text-[var(--line-strong)] focus:border-volt"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-pill bg-volt px-5 py-2.5 text-caption font-medium text-ink transition-transform duration-quick hover:bg-volt-hover active:scale-95"
        >
          Записать продажу
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-caption font-medium text-mute transition-colors duration-quick hover:text-[var(--text)]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  step,
  min,
  max,
}: {
  name: string;
  label: string;
  defaultValue?: number;
  step: string;
  min: string;
  max?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-caption text-mute">{label}</span>
      <input
        name={name}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        defaultValue={defaultValue}
        placeholder="0"
        className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg)] px-3 py-2.5 font-sans tabular-nums text-[var(--text)] outline-none focus:border-volt"
      />
    </label>
  );
}

function Pill({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div
      className={`flex items-baseline gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg)] ${
        small ? "px-2.5 py-1" : "px-3 py-1.5"
      }`}
    >
      <span className="text-caption text-mute">{label}</span>
      <span className="font-sans text-caption font-semibold tabular-nums text-[var(--text)]">{value}</span>
    </div>
  );
}
