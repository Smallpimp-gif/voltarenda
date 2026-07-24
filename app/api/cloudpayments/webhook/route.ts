// POST /api/cloudpayments/webhook
//
// Сюда CloudPayments стучится после КАЖДОГО успешного списания (уведомление
// Pay). Это сердце автоматизации: платёж сам попадает в учёт, кабинет
// пересчитывает остаток, бот перестаёт напоминать — руками ничего не надо.
//
// Настройка в ЛК CloudPayments: Уведомления → Pay →
//   https://<домен>/api/cloudpayments/webhook  (формат: application/x-www-form-urlencoded)
//
// Безопасность: CloudPayments подписывает тело запроса HMAC-SHA256 на
// API Secret и кладёт подпись в заголовок Content-HMAC. Без совпадения
// подписи запрос отбрасывается — иначе любой мог бы «оплатить» чужой долг.
//
// Ответ ДОЛЖЕН быть {"code": 0} — иначе CloudPayments считает уведомление
// непринятым и повторяет его. Поэтому даже на «не нашли арендатора»
// отвечаем 0, но громко сообщаем оператору, чтобы разобрал руками.

import { NextResponse } from "next/server";
import crypto from "crypto";
import { readJSON, writeJSON } from "@/lib/store";
import { getTenantById } from "@/lib/auth/tenants";
import { getPaidThrough, setPaidThrough } from "@/lib/payments";
import { getSubscription, saveSubscription } from "@/lib/subscriptions";
import { notifyOperator } from "@/lib/notify";

export const runtime = "nodejs";

// Обработанные транзакции — защита от двойного зачёта при повторной
// доставке уведомления (CloudPayments повторяет, пока не получит code 0).
const TX_KEY = "bot/cp-transactions";

const ok = () => NextResponse.json({ code: 0 });

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  // Сравнение с постоянным временем — чтобы подпись нельзя было подобрать.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.CLOUDPAYMENTS_API_SECRET;
  if (!secret) {
    console.error("[cp/webhook] CLOUDPAYMENTS_API_SECRET не задан — уведомление отброшено");
    return NextResponse.json({ code: 13, message: "not configured" }, { status: 503 });
  }

  // Сырое тело нужно целиком: HMAC считается именно по нему, до разбора.
  const raw = await req.text();
  const signature =
    req.headers.get("content-hmac") ?? req.headers.get("x-content-hmac");

  if (!verifySignature(raw, signature, secret)) {
    console.error("[cp/webhook] неверная подпись — запрос отброшен");
    return NextResponse.json({ code: 13, message: "bad signature" }, { status: 403 });
  }

  const p = new URLSearchParams(raw);
  const transactionId = p.get("TransactionId") ?? "";
  const accountId = (p.get("AccountId") ?? "").trim();
  const amount = Number(p.get("Amount") ?? 0);
  const subscriptionId = p.get("SubscriptionId") ?? "";

  if (!transactionId) return ok();

  // Идемпотентность: тот же TransactionId не засчитываем дважды.
  const seen = await readJSON<Record<string, string>>(TX_KEY, {});
  if (seen[transactionId]) return ok();

  const tenant = accountId ? await getTenantById(accountId) : null;

  if (!tenant) {
    await notifyOperator(
      `⚠️ <b>Платёж без арендатора</b>\n\n` +
        `Пришло списание на <b>${amount} ₽</b>, но арендатор не найден.\n` +
        `AccountId: <code>${accountId || "—"}</code>\n` +
        `Транзакция: <code>${transactionId}</code>\n\n` +
        `Деньги получены — зачти оплату вручную в кабинете.`,
    );
    seen[transactionId] = `unmatched:${accountId}`;
    await writeJSON(TX_KEY, seen);
    return ok();
  }

  // Сколько недель закрывает платёж. Обычно ровно одну, но если сумма
  // кратна недельной (доплатил вперёд) — засчитываем соответственно.
  const weekly = tenant.weekly > 0 ? tenant.weekly : amount;
  const weeks = Math.max(1, Math.round(amount / weekly));

  const before = await getPaidThrough(tenant.id);
  const after = before + weeks;
  await setPaidThrough(tenant.id, after);

  // Первое списание по подписке — запоминаем карту, чтобы кабинет показал
  // «автосписание включено» вместо кнопки «привязать карту».
  if (subscriptionId) {
    const known = await getSubscription(tenant.id);
    if (!known || known.subscriptionId !== subscriptionId || known.status !== "active") {
      await saveSubscription(tenant.id, {
        subscriptionId,
        cardLastFour: p.get("CardLastFour") ?? undefined,
        cardType: p.get("CardType") ?? undefined,
        weekly,
        mode: tenant.type === "выкуп" ? "buyout" : "rent",
        maxPeriods: tenant.buyoutWeeks ?? 52,
        status: "active",
      });
    }
  }

  seen[transactionId] = `${tenant.id}:${after}`;
  await writeJSON(TX_KEY, seen);

  const total = tenant.buyoutWeeks;
  const left = total ? Math.max(0, total - after) : null;

  await notifyOperator(
    `✅ <b>Платёж зачтён</b>\n\n` +
      `${tenant.name} · договор ${tenant.contract}\n` +
      `Сумма: <b>${amount} ₽</b>\n` +
      `Платёж: ${after}${total ? ` из ${total}` : ""}\n` +
      (left !== null ? `Осталось: ${left} нед.\n` : "") +
      (subscriptionId ? `Подписка: <code>${subscriptionId}</code>\n` : ""),
  );

  return ok();
}
