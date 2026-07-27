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
  loadTenants,
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
  updateLedgerEntry,
  deleteLedgerEntry,
  findLedgerEntry,
  EDITABLE_KINDS,
  EXPENSE_CATEGORIES,
} from "@/lib/ledger";
import {
  addPurchase,
  addSale,
  editPurchase,
  deletePurchase,
  deleteSale,
} from "@/lib/purchases";
import {
  paymentState,
  effectiveWeekly,
  depositOf,
  mskDayNum,
  isoToDayNum,
  dayNumToIso,
  type TenantPosition,
  type PaymentPeriod,
} from "@/lib/schedule";
import { addDepositLogEntry, loadDepositLog, depositAdjustmentsTotal } from "@/lib/deposits";

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
  const { paidThrough, partialPaid, referralWeeks } = await getPayment(id);

  if (dir === "referral") {
    // Привёл друга под выкуп → минус неделя. Прогресс +1, но денег НЕТ
    // (в кассу/доход не идёт — это бонус).
    await setPayment(id, {
      paidThrough: paidThrough + 1,
      partialPaid,
      referralWeeks: referralWeeks + 1,
    });
  } else if (dir === "referral-dec") {
    if (referralWeeks > 0) {
      await setPayment(id, {
        paidThrough: Math.max(0, paidThrough - 1),
        partialPaid,
        referralWeeks: referralWeeks - 1,
      });
    }
  } else if (dir === "partial") {
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

// Заработок с магазина — доход в кассу (+). name = комментарий или «Магазин».
export async function addShopIncomeAction(formData: FormData): Promise<void> {
  await requireOwner();
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return;
  const note = String(formData.get("note") ?? "").trim().slice(0, 120);
  await addLedgerEntry({
    tenantId: "",
    name: note || "Магазин",
    amount,
    weeks: 0,
    kind: "shop",
    note: note || undefined,
  });
  revalidatePath("/cabinet/owner");
}

// Расход из кассы (−). Категория из фикс. списка, сумма вводится
// положительной, хранится отрицательной.
export async function addExpenseAction(formData: FormData): Promise<void> {
  await requireOwner();
  const raw = Math.round(Number(formData.get("amount")) * 100) / 100;
  if (!Number.isFinite(raw) || raw <= 0) return;
  const catRaw = String(formData.get("category") ?? "").trim();
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(catRaw)
    ? catRaw
    : "Прочее";
  const note = String(formData.get("note") ?? "").trim().slice(0, 120);
  await addLedgerEntry({
    tenantId: "",
    name: note || category,
    amount: -raw,
    weeks: 0,
    kind: "expense",
    category,
    note: note || undefined,
  });
  revalidatePath("/cabinet/owner");
}

// Правка записи кассы: сумма, комментарий, категория (для расхода). Меняем
// только операции, введённые вручную (магазин / расход / корректировка) —
// аренда правится через оплату арендатора.
export async function editLedgerEntryAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const entry = await findLedgerEntry(id);
  if (!entry || !EDITABLE_KINDS.includes(entry.kind)) return;

  const raw = Math.round(Number(formData.get("amount")) * 100) / 100;
  if (!Number.isFinite(raw)) return;
  const note = String(formData.get("note") ?? "").trim().slice(0, 120);

  const patch: Parameters<typeof updateLedgerEntry>[1] = { note: note || undefined };

  if (entry.kind === "expense") {
    if (raw <= 0) return; // расход вводится положительным
    const catRaw = String(formData.get("category") ?? "").trim();
    const category = (EXPENSE_CATEGORIES as readonly string[]).includes(catRaw)
      ? catRaw
      : entry.category ?? "Прочее";
    patch.amount = -raw;
    patch.category = category;
    patch.name = note || category;
  } else if (entry.kind === "shop") {
    if (raw <= 0) return; // доход магазина — положительный
    patch.amount = raw;
    patch.name = note || "Магазин";
  } else {
    // manual — корректировка, знак свободный, имя сохраняем
    patch.amount = raw;
  }

  await updateLedgerEntry(id, patch);
  revalidatePath("/cabinet/owner");
}

// Удаление записи кассы — только для ручных операций (магазин / расход /
// корректировка). Аренду удаляем через откат оплаты у арендатора.
export async function deleteLedgerEntryAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const entry = await findLedgerEntry(id);
  if (!entry || !EDITABLE_KINDS.includes(entry.kind)) return;
  await deleteLedgerEntry(id);
  revalidatePath("/cabinet/owner");
}

// --- Закупки товара (поштучный учёт, прибыль) -------------------------

// Новая закупка: название, кол-во, цена за штуку, доставка.
export async function addPurchaseAction(formData: FormData): Promise<void> {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const qty = Math.floor(Number(formData.get("qty")));
  const unitCost = Math.round(Number(formData.get("unitCost")) * 100) / 100;
  const delivery = Math.round(Number(formData.get("delivery")) * 100) / 100;
  if (!name) return;
  if (!Number.isFinite(qty) || qty <= 0) return;
  if (!Number.isFinite(unitCost) || unitCost < 0) return;
  const del = Number.isFinite(delivery) && delivery > 0 ? delivery : 0;
  await addPurchase({ name, qty, unitCost, delivery: del });
  revalidatePath("/cabinet/owner");
}

// Продажа части остатка партии: кол-во + выручка.
export async function addSaleAction(formData: FormData): Promise<void> {
  await requireOwner();
  const purchaseId = String(formData.get("purchaseId") ?? "");
  const qty = Math.floor(Number(formData.get("qty")));
  const revenue = Math.round(Number(formData.get("revenue")) * 100) / 100;
  const note = String(formData.get("note") ?? "").trim().slice(0, 120);
  if (!purchaseId) return;
  if (!Number.isFinite(qty) || qty <= 0) return;
  if (!Number.isFinite(revenue) || revenue < 0) return;
  await addSale(purchaseId, { qty, revenue, note: note || undefined });
  revalidatePath("/cabinet/owner");
}

// Правка параметров закупки (название / кол-во / цена / доставка).
export async function editPurchaseAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const qty = Math.floor(Number(formData.get("qty")));
  const unitCost = Math.round(Number(formData.get("unitCost")) * 100) / 100;
  const delivery = Math.round(Number(formData.get("delivery")) * 100) / 100;
  const patch: Parameters<typeof editPurchase>[1] = {};
  if (name) patch.name = name;
  if (Number.isFinite(qty) && qty > 0) patch.qty = qty;
  if (Number.isFinite(unitCost) && unitCost >= 0) patch.unitCost = unitCost;
  if (Number.isFinite(delivery) && delivery >= 0) patch.delivery = delivery;
  await editPurchase(id, patch);
  revalidatePath("/cabinet/owner");
}

export async function deletePurchaseAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deletePurchase(id);
  revalidatePath("/cabinet/owner");
}

export async function deleteSaleAction(formData: FormData): Promise<void> {
  await requireOwner();
  const purchaseId = String(formData.get("purchaseId") ?? "");
  const saleId = String(formData.get("saleId") ?? "");
  if (!purchaseId || !saleId) return;
  await deleteSale(purchaseId, saleId);
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

// Обнулить залог арендатора: deposit → 0 с записью в журнал (кто, сколько,
// когда). Вернуть можно через форму редактирования (поле «Залог»).
export async function zeroDepositAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const t = await getTenantById(id);
  if (!t) return;
  const amount = depositOf(t);
  if (amount <= 0) return;
  await patchTenant(id, { deposit: 0 });
  await addDepositLogEntry({ tenantId: id, name: t.name, amount, kind: "zero" });
  revalidatePath("/cabinet/owner");
}

// Текущий итог залогов «на руках»: сумма по арендаторам + ручные
// корректировки. Тот же принцип, что cassaTotal.
async function depositsOnHand(): Promise<number> {
  const [tenants, log] = await Promise.all([loadTenants(), loadDepositLog()]);
  const tenantSum = tenants.reduce((s, t) => s + depositOf(t), 0);
  return tenantSum + depositAdjustmentsTotal(log);
}

// Задать сумму залогов вручную (до копеек) — как в кассе: пишем
// корректировку на разницу, история прозрачна.
export async function setDepositsTotalAction(formData: FormData): Promise<void> {
  await requireOwner();
  const target = Math.max(0, Math.round(Number(formData.get("total")) * 100) / 100);
  if (!Number.isFinite(target)) return;
  const current = await depositsOnHand();
  const delta = Math.round((target - current) * 100) / 100;
  if (delta !== 0) {
    await addDepositLogEntry({
      tenantId: "",
      name: "Корректировка залогов",
      amount: delta,
      kind: "manual",
    });
  }
  revalidatePath("/cabinet/owner");
}

// Обнулить итог залогов — корректировка на −текущую сумму. Список
// «кому какой залог вернуть» у арендаторов не трогается.
export async function resetDepositsAction(): Promise<void> {
  await requireOwner();
  const current = await depositsOnHand();
  if (current !== 0) {
    await addDepositLogEntry({
      tenantId: "",
      name: "Обнуление залогов",
      amount: -current,
      kind: "manual",
    });
  }
  revalidatePath("/cabinet/owner");
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Разбор и валидация полей арендатора из формы.
function parseTenant(formData: FormData): TenantInput | string {
  const name = String(formData.get("name") ?? "").trim();
  const contract = String(formData.get("contract") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const weekly = Number(formData.get("weekly"));
  const periodRaw = String(formData.get("period") ?? "").trim();
  const period: PaymentPeriod =
    periodRaw === "day" || periodRaw === "month" ? periodRaw : "week";
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
    period,
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
