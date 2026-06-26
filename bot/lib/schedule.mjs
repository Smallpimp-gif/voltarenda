// Расчёт дат недельных платежей. Всё в целых «днях по МСК», чтобы не
// зависеть от времени суток и часового пояса: и дату заезда, и сегодня
// сводим к календарному дню в Europe/Moscow и считаем разницу в днях.
// У МСК нет перехода на летнее время (UTC+3 с 2014), поэтому
// целочисленная арифметика дней безопасна.

export function mskDayNum(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const [y, m, d] = fmt.format(date).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function isoToDayNum(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function formatDay(dayNum) {
  const dt = new Date(dayNum * 86400000);
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${d}.${m}.${dt.getUTCFullYear()}`;
}

// Ближайшая дата платежа (>= сегодня). Платежи каждые 7 дней от заезда.
// paymentNumber — порядковый номер платежа (1-based). completed=true,
// если выкуп уже выплачен полностью.
export function nextDue(tenant, todayNum) {
  const startNum = isoToDayNum(tenant.startDate);
  const delta = todayNum - startNum;
  const dueNum = delta <= 0 ? startNum : startNum + Math.ceil(delta / 7) * 7;
  const paymentNumber = Math.round((dueNum - startNum) / 7) + 1;
  let completed = false;
  if (tenant.buyoutWeeks) {
    const lastDueNum = startNum + (tenant.buyoutWeeks - 1) * 7;
    completed = dueNum > lastDueNum;
  }
  return { dueNum, paymentNumber, completed };
}

// Кому сегодня слать: offset 2 (послезавтра), 1 (завтра), 0 (сегодня).
// Только привязанные активные подписчики.
export function computeDueReminders(tenants, subscribers, todayNum) {
  const byId = new Map(tenants.map((t) => [t.id, t]));
  const out = [];
  for (const sub of Object.values(subscribers)) {
    if (sub.status !== "active" || !sub.tenantId) continue;
    const tenant = byId.get(sub.tenantId);
    if (!tenant) continue;
    const { dueNum, paymentNumber, completed } = nextDue(tenant, todayNum);
    if (completed) continue;
    const offset = dueNum - todayNum;
    if (offset >= 0 && offset <= 2) out.push({ sub, tenant, offset, dueNum, paymentNumber });
  }
  return out;
}
