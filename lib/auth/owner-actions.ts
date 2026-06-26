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
  type TenantInput,
} from "@/lib/auth/tenants";
import { setAvailableBikes } from "@/lib/settings";
import { getPaidThrough, setPaidThrough } from "@/lib/payments";
import { paymentState } from "@/lib/schedule";

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
  if (dir === "catchup") {
    const t = getTenantById(id);
    if (t) {
      const ps = paymentState(t, getPaidThrough(id));
      setPaidThrough(id, ps.paidThrough + ps.overdueCount); // = все просроченные
    }
  } else {
    const cur = getPaidThrough(id);
    setPaidThrough(id, dir === "dec" ? cur - 1 : cur + 1);
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

  return {
    name,
    contract,
    type,
    weekly: Math.round(weekly),
    startDate,
    buyoutWeeks,
    telegramUsername,
  };
}

export async function addTenantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const parsed = parseTenant(formData);
  if (typeof parsed === "string") return { error: parsed };
  addTenant(parsed);
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
  const ok = updateTenant(id, parsed);
  if (!ok) return { error: "Арендатор не найден." };
  revalidatePath("/cabinet/owner");
  redirect("/cabinet/owner");
}

export async function deleteTenantAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  deleteTenant(id);
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
  setAvailableBikes(n);
  revalidatePath("/cabinet/owner");
  revalidatePath("/"); // лендинг показывает доступность
  return { error: null, ok: true };
}
