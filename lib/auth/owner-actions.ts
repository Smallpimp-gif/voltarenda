"use server";

// Server Actions кабинета владельца: CRUD арендаторов и число свободных
// велосипедов. Каждое действие проверяет роль owner. revalidatePath
// обновляет админку и лендинг (там показывается число велосипедов).

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  addTenant,
  updateTenant,
  deleteTenant,
  getTenantById,
  patchTenant,
  type TenantInput,
} from "@/lib/auth/tenants";
import { setAvailableBikes } from "@/lib/settings";
import { getPaidThrough, setPaidThrough, getPayment, setPayment } from "@/lib/payments";
import {
  addLedgerEntry,
  removeLastLedgerEntry,
  resetCassa,
  loadLedger,
  cassaTotal,
} from "@/lib/ledger";
import {
  paymentState,
  effectiveWeekly,
  mskDayNum,
  isoToDayNum,
  dayNumToIso,
  type TenantPosition,
} from "@/lib/schedule";

export type ActionState = { error: string | null; ok?: boolean };

async function requireOwner() {
  const cu = await getCurrentUser();
  if (!cu || cu.user.role !== "owner") redirect("/cabinet/owner/login");
}

// Отметка оплат: +1 (оплатил), −1 (отменить), "catchup" (отметить всё до
// сегодня — для разовой инициализации старых арендаторов).
export async function markPaidAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "inc");
  if (!id) return;
  const t = await getTenantById(id);
  if (!t) return;
  const ew = effectiveWeekly(t); // фактический платёж (с доп. позициями)
  const { paidThrough, partialPaid } = await getPayment(id);

  if (dir === "partial") {
    // Частичная оплата: вносим произвольную сумму. Копится в текущую неделю;
    // как наберётся на полную (или несколько) — закрываются недели.
    const amount = Math.max(0, Math.round((Number(formData.get("amount")) || 0) * 100) / 100);
    if (amount > 0 && ew > 0) {
      const totalPartial = partialPaid + amount;
      const weeks = Math.floor(totalPartial / ew);
      await setPayment(id, {
        paidThrough: paidThrough + weeks,
        partialPaid: totalPartial - weeks * ew,
      });
      await addLedgerEntry({ tenantId: id, name: t.name, amount, weeks, kind: "weekly" });
    }
  } else if (dir === "catchup") {
    const ps = paymentState(t, paidThrough, mskDayNum(), partialPaid);
    if (ps.overdueCount > 0) {
      await setPayment(id, { paidThrough: paidThrough + ps.overdueCount, partialPaid });
      await addLedgerEntry({
        tenantId: id,
        name: t.name,
        amount: ps.overdueCount * ew,
        weeks: ps.overdueCount,
        kind: "catchup",
      });
    }
  } else if (dir === "dec") {
    // Откат: сначала отменяем частичную (если есть), иначе −1 неделя.
    if (partialPaid > 0) {
      await setPayment(id, { paidThrough, partialPaid: 0 });
    } else {
      await setPayment(id, { paidThrough: Math.max(0, paidThrough - 1), partialPaid: 0 });
    }
    await removeLastLedgerEntry(id);
  } else {
    // «Оплатил» — закрываем текущую неделю целиком (с учётом уже внесённого).
    const due = Math.max(0, ew - partialPaid);
    await setPayment(id, { paidThrough: paidThrough + 1, partialPaid: 0 });
    await addLedgerEntry({ tenantId: id, name: t.name, amount: due, weeks: 1, kind: "weekly" });
  }
  revalidatePath("/cabinet/owner");
}

// Обнулить кассу — чистит журнал оплат и общую сумму. Прогресс выкупа
// арендаторов (paidThrough) НЕ трогается.
export async function resetLedgerAction(): Promise<void> {
  await requireOwner();
  await resetCassa();
  revalidatePath("/cabinet/owner");
}

// Задать сумму кассы вручную: добавляем запись-корректировку на разницу,
// чтобы итог стал ровно нужным числом (история сохраняется, аудит прозрачен).
export async function setLedgerTotalAction(formData: FormData): Promise<void> {
  await requireOwner();
  // До копеек: округляем к 2 знакам, не к целым рублям.
  const target = Math.max(0, Math.round(Number(formData.get("total")) * 100) / 100);
  if (!Number.isFinite(target)) return;
  const file = await loadLedger();
  const delta = target - cassaTotal(file);
  if (delta !== 0) {
    await addLedgerEntry({
      tenantId: "",
      name: "Корректировка кассы",
      amount: delta,
      weeks: 0,
      kind: "manual",
    });
  }
  revalidatePath("/cabinet/owner");
}

// Пауза/снятие паузы выкупа. На паузе график заморожен (выкупная сумма не
// уменьшается), вместо недельных — фикс. плата за паузу отдельно. При снятии
// накапливаем длительность паузы в pausedDays, чтобы сдвинуть график вперёд.
export async function togglePauseAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const t = await getTenantById(id);
  if (!t || t.type !== "выкуп") return; // пауза — только для выкупа
  const today = mskDayNum();
  if (t.pausedSince) {
    const days = Math.max(0, today - isoToDayNum(t.pausedSince));
    await patchTenant(id, {
      pausedSince: null,
      pausedDays: (t.pausedDays ?? 0) + days,
    });
  } else {
    await patchTenant(id, { pausedSince: dayNumToIso(today) });
  }
  revalidatePath("/cabinet/owner");
  revalidatePath("/cabinet");
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Разбор и валидация полей арендатора из формы.
function parseTenant(formData: FormData): TenantInput | string {
  const name = String(formData.get("name") ?? "").trim();
  const contract = String(formData.get("contract") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const weekly = Number(formData.get("weekly"));
  const startDate = String(formData.get("startDate") ?? "").trim();
  const buyoutRaw = String(formData.get("buyoutWeeks") ?? "").trim();
  const telegramUsername = String(formData.get("telegramUsername") ?? "")
    .trim()
    .replace(/^@/, "");

  if (name.length < 2) return "Укажите фамилию.";
  if (!contract) return "Укажите номер договора.";
  if (type !== "аренда" && type !== "выкуп") return "Выберите тип: аренда или выкуп.";
  if (!Number.isFinite(weekly) || weekly <= 0) return "Недельный платёж — положительное число.";
  if (!DATE_RE.test(startDate)) return "Дата заезда в формате ГГГГ-ММ-ДД.";

  let buyoutWeeks: number | null = null;
  if (type === "выкуп") {
    const w = Number(buyoutRaw);
    if (!Number.isInteger(w) || w <= 0) return "Для выкупа укажите число недель (целое > 0).";
    buyoutWeeks = w;
  }

  // Доп. позиции — JSON-массив из скрытого поля формы.
  let positions: TenantPosition[] = [];
  const posRaw = String(formData.get("positions") ?? "").trim();
  if (posRaw) {
    try {
      const arr = JSON.parse(posRaw);
      if (Array.isArray(arr)) {
        positions = arr
          .map(
            (p): TenantPosition => ({
              name: String(p?.name ?? "").trim(),
              cost: Math.max(0, Math.round(Number(p?.cost) || 0)),
              weekly: Math.max(0, Math.round(Number(p?.weekly) || 0)),
              intoBuyout: Boolean(p?.intoBuyout),
            }),
          )
          .filter((p) => p.name.length > 0);
      }
    } catch {
      /* игнорируем кривой JSON */
    }
  }

  const depositRaw = String(formData.get("deposit") ?? "").trim();
  const deposit = depositRaw === "" ? undefined : Math.max(0, Math.round(Number(depositRaw) || 0));

  return {
    name,
    contract,
    type,
    weekly: Math.round(weekly),
    startDate,
    buyoutWeeks,
    telegramUsername,
    positions,
    deposit,
  };
}

// «Внесено выплат» — необязательное поле формы; задаёт paidThrough напрямую.
async function applyPaidThrough(formData: FormData, id: string): Promise<void> {
  const raw = formData.get("paidThrough");
  if (raw == null || String(raw).trim() === "") return;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) await setPaidThrough(id, Math.floor(n));
}

export async function addTenantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const parsed = parseTenant(formData);
  if (typeof parsed === "string") return { error: parsed };
  const tenant = await addTenant(parsed);
  await applyPaidThrough(formData, tenant.id);
  revalidatePath("/cabinet/owner");
  redirect("/cabinet/owner");
}

export async function updateTenantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  const parsed = parseTenant(formData);
  if (typeof parsed === "string") return { error: parsed };
  const ok = await updateTenant(id, parsed);
  if (!ok) return { error: "Арендатор не найден." };
  await applyPaidThrough(formData, id);
  revalidatePath("/cabinet/owner");
  redirect("/cabinet/owner");
}

export async function deleteTenantAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  await deleteTenant(id);
  revalidatePath("/cabinet/owner");
  redirect("/cabinet/owner");
}

export async function setBikesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const n = Number(formData.get("availableBikes"));
  if (!Number.isFinite(n) || n < 0) return { error: "Число велосипедов — 0 или больше." };
  await setAvailableBikes(n);
  revalidatePath("/cabinet/owner");
  revalidatePath("/"); // лендинг показывает доступность
  return { error: null, ok: true };
}
