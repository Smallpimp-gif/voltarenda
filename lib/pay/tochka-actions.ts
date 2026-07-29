"use server";

// Оплата аренды арендатором через Точку. Создаёт платёжную ссылку на сумму
// его периода и отправляет на страницу оплаты Точки (там СБП/карта на выбор).
// Крон-воркер (workers/tochka-poll) потом подтвердит оплату и отчитается боту.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { effectiveWeekly, buildCabinetView } from "@/lib/schedule";
import { getPayment } from "@/lib/payments";
import { createPaymentLink, tochkaEnabled } from "@/lib/tochka";
import { addPending } from "@/lib/tochka-payments";

function siteUrl(): string {
  return process.env.SITE_URL || "https://voltarenda.small-pimp.workers.dev";
}

export async function payRentAction(): Promise<void> {
  const cu = await getCurrentUser();
  if (!cu || cu.user.role === "owner" || !cu.tenant) redirect("/cabinet/login");
  if (!tochkaEnabled()) redirect("/cabinet?pay=off");

  const tenant = cu.tenant;
  const amount = effectiveWeekly(tenant);
  if (!(amount > 0)) redirect("/cabinet");

  const v = buildCabinetView(tenant);
  if (v.completed || v.paused) redirect("/cabinet"); // платить нечего

  const { paidThrough } = await getPayment(tenant.id);
  const num = paidThrough + 1;
  // orderId уникален на попытку; таймстамп — не в воркфлоу, обычный экшен.
  const orderId = `t-${tenant.id}-${num}-${Date.now().toString(36)}`;
  const purpose = `Аренда, договор ${tenant.contract}, платёж ${num}`.slice(0, 140);

  // email для чека — только настоящий (у входа через Telegram он синтетический).
  const email =
    cu.user.email && !cu.user.email.endsWith("@telegram.local") ? cu.user.email : undefined;

  const created = await createPaymentLink({
    amount,
    purpose,
    orderId,
    redirectUrl: `${siteUrl()}/cabinet?paid=${encodeURIComponent(orderId)}`,
    failRedirectUrl: `${siteUrl()}/cabinet?payfail=1`,
    itemName: `Аренда электровелосипеда, договор ${tenant.contract}`,
    client: email ? { email } : undefined,
  });

  if (!created) redirect("/cabinet?payfail=1");

  await addPending({
    orderId,
    operationId: created.operationId,
    tenantId: tenant.id,
    name: tenant.name,
    amount,
    weeks: 1,
    paymentLink: created.paymentLink,
  });

  redirect(created.paymentLink);
}
