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

// --- Период оплаты (day/week/month). Держать в синхроне с lib/schedule.ts ---

export function periodOf(t) {
  return t.period ?? "week";
}

function ymdOf(dayNum) {
  const dt = new Date(dayNum * 86400000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}
function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Дата k-го шага периода от startNum (k=0 → сам старт). Месяц — календарный,
// с клампом дня к длине месяца (31 янв + 1 мес → 28/29 фев).
export function addPeriods(startNum, period, k) {
  if (period === "day") return startNum + k;
  if (period === "week") return startNum + k * 7;
  const { y, m, d } = ymdOf(startNum);
  const idx = m - 1 + k;
  const ny = y + Math.floor(idx / 12);
  const nm = ((idx % 12) + 12) % 12 + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return Math.floor(Date.UTC(ny, nm - 1, nd) / 86400000);
}

export function periodsElapsed(startNum, period, todayNum) {
  if (todayNum <= startNum) return 0;
  if (period === "day") return todayNum - startNum;
  if (period === "week") return Math.floor((todayNum - startNum) / 7);
  const s = ymdOf(startNum);
  const t = ymdOf(todayNum);
  let k = (t.y - s.y) * 12 + (t.m - s.m);
  if (k < 0) return 0;
  if (addPeriods(startNum, "month", k) > todayNum) k -= 1;
  else if (addPeriods(startNum, "month", k + 1) <= todayNum) k += 1;
  return Math.max(0, k);
}

// Ближайшая дата платежа (>= сегодня) с учётом периода оплаты.
// paymentNumber — порядковый номер платежа (1-based). completed=true,
// если выкуп уже выплачен полностью.
export function nextDue(tenant, todayNum) {
  const startNum = isoToDayNum(tenant.startDate);
  const period = periodOf(tenant);
  const e = periodsElapsed(startNum, period, todayNum);
  const k = addPeriods(startNum, period, e) >= todayNum ? e : e + 1;
  const dueNum = addPeriods(startNum, period, k);
  const paymentNumber = k + 1;
  let completed = false;
  if (tenant.buyoutWeeks) {
    const lastDueNum = addPeriods(startNum, period, tenant.buyoutWeeks - 1);
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
