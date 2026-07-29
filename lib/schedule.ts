// Расчёт дат недельных платежей — TS-порт bot/lib/schedule.mjs для кабинета.
// Всё в целых «днях по МСК», чтобы не зависеть от времени суток и часового
// пояса: и дату заезда, и сегодня сводим к календарному дню в Europe/Moscow
// и считаем разницу в днях. У МСК нет перехода на летнее время (UTC+3 с 2014),
// поэтому целочисленная арифметика дней безопасна.
//
// Бот (bot/lib/schedule.mjs) держит свою копию намеренно — он отдельный
// процесс на .mjs без сборки. Логика nextDue идентична; менять надо обе.

// Доп. позиция к договору (напр. второй АКБ, добавленный позже).
// weekly — добавка к недельному платежу; cost — стоимость позиции;
// intoBuyout — идёт ли стоимость в общую выкупную сумму.
export type TenantPosition = {
  name: string;
  cost: number;
  weekly: number;
  intoBuyout: boolean;
};

// Период оплаты. «week» — историческое поведение (по умолчанию), поэтому
// существующие арендаторы без поля period ведут себя ровно как раньше.
export type PaymentPeriod = "day" | "week" | "month";

export type Tenant = {
  id: string;
  name: string; // фамилия
  contract: string;
  type: "аренда" | "выкуп" | string;
  weekly: number; // сумма за ОДИН период (не обязательно неделя — см. period)
  period?: PaymentPeriod; // единица оплаты; по умолчанию "week"
  startDate: string; // YYYY-MM-DD
  buyoutWeeks: number | null; // число ПЕРИОДОВ до выкупа (не обязательно недель)
  telegramUsername?: string;
  // Пауза выкупа: пока на паузе, график заморожен (выкупная сумма не идёт),
  // вместо недельных — фикс. плата за паузу (PAUSE_FEE_MONTHLY), отдельно.
  pausedSince?: string | null; // ISO YYYY-MM-DD — дата постановки на паузу
  pausedDays?: number; // накоплено дней паузы из завершённых периодов
  positions?: TenantPosition[]; // доп. позиции (АКБ и т.п.)
  deposit?: number; // залог, ₽ (по умолчанию DEFAULT_DEPOSIT)
  receiptContact?: string; // email или телефон для чека 54-ФЗ (при онлайн-оплате)
};

// Плата за паузу выкупа — фикс., в месяц, отдельно от выкупной суммы.
export const PAUSE_FEE_MONTHLY = 11000;

// Залог по умолчанию (если у арендатора не задан явно).
export const DEFAULT_DEPOSIT = 5000;
export function depositOf(t: Pick<Tenant, "deposit">): number {
  return t.deposit ?? DEFAULT_DEPOSIT;
}

// Фактический недельный платёж = базовый + все доп. позиции.
export function effectiveWeekly(
  t: Pick<Tenant, "weekly" | "positions">,
): number {
  return t.weekly + (t.positions ?? []).reduce((s, p) => s + p.weekly, 0);
}

// Полная выкупная сумма = база (недель × базовый платёж) + стоимости
// позиций, помеченных «в выкуп». null для аренды.
export function buyoutTotal(
  t: Pick<Tenant, "weekly" | "buyoutWeeks" | "positions">,
): number | null {
  if (!t.buyoutWeeks) return null;
  const base = t.buyoutWeeks * t.weekly;
  const pos = (t.positions ?? [])
    .filter((p) => p.intoBuyout)
    .reduce((s, p) => s + p.cost, 0);
  return base + pos;
}

export function mskDayNum(date = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(date).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function isoToDayNum(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function formatDay(dayNum: number): string {
  const dt = new Date(dayNum * 86400000);
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${d}.${m}.${dt.getUTCFullYear()}`;
}

export function dayNumToIso(dayNum: number): string {
  const dt = new Date(dayNum * 86400000);
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${m}-${d}`;
}

// --- Период оплаты: календарная арифметика -----------------------------

export function periodOf(t: { period?: PaymentPeriod }): PaymentPeriod {
  return t.period ?? "week";
}

// Короткая метка периода для UI: «дн» / «нед» / «мес».
export function periodShort(period: PaymentPeriod): string {
  return period === "day" ? "дн" : period === "month" ? "мес" : "нед";
}

// Сумма за период → недельный эквивалент (для сводного «недельного дохода»,
// где смешаны разные периоды). Сутки ×7, месяц ×12/52 (год ≈ 52 недели).
export function weeklyEquivalent(amountPerPeriod: number, period: PaymentPeriod): number {
  if (period === "day") return amountPerPeriod * 7;
  if (period === "month") return (amountPerPeriod * 12) / 52;
  return amountPerPeriod;
}

function ymdOf(dayNum: number): { y: number; m: number; d: number } {
  const dt = new Date(dayNum * 86400000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate(); // m 1-based; «день 0» = посл. день
}

// Дата k-го шага периода от startNum (k=0 → сам startNum). Месяц — строго
// календарный: тот же день месяца, что у старта, с клампом к длине месяца
// (31 января + 1 мес → 28/29 февраля; + ещё 1 → 31 марта, привязка к числу
// старта сохраняется).
export function addPeriods(startNum: number, period: PaymentPeriod, k: number): number {
  if (period === "day") return startNum + k;
  if (period === "week") return startNum + k * 7;
  const { y, m, d } = ymdOf(startNum);
  const idx = m - 1 + k; // 0-based индекс месяца
  const ny = y + Math.floor(idx / 12);
  const nm = ((idx % 12) + 12) % 12 + 1; // 1-based
  const nd = Math.min(d, daysInMonth(ny, nm));
  return Math.floor(Date.UTC(ny, nm - 1, nd) / 86400000);
}

// Сколько шагов периода полностью «созрело» к todayNum: наибольшее k≥0 с
// addPeriods(start,k) ≤ today. Для day/week — floor((today−start)/шаг).
export function periodsElapsed(
  startNum: number,
  period: PaymentPeriod,
  todayNum: number,
): number {
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

// «Эффективная» дата начала для накопления платежей: сдвинута вперёд на все
// дни паузы (завершённые + текущий незакрытый период). Пока на паузе, сдвиг
// растёт ровно с todayNum, поэтому число «созревших» платежей замирает —
// график выкупа стоит, выкупная сумма не уменьшается.
export function accrualStartNum(
  tenant: Pick<Tenant, "startDate" | "pausedSince" | "pausedDays">,
  todayNum: number,
): number {
  const startNum = isoToDayNum(tenant.startDate);
  const done = tenant.pausedDays ?? 0;
  const ongoing = tenant.pausedSince
    ? Math.max(0, todayNum - isoToDayNum(tenant.pausedSince))
    : 0;
  return startNum + done + ongoing;
}

// Ближайшая дата платежа (>= сегодня). Платежи каждые 7 дней от заезда.
// paymentNumber — порядковый номер платежа (1-based). completed=true,
// если выкуп уже выплачен полностью.
export function nextDue(
  tenant: Pick<Tenant, "startDate" | "buyoutWeeks" | "pausedSince" | "pausedDays" | "period">,
  todayNum: number,
): { dueNum: number; paymentNumber: number; completed: boolean } {
  const startNum = accrualStartNum(tenant, todayNum);
  const period = periodOf(tenant);
  // Ближайшая дата платежа ≥ сегодня. Платежи — в addPeriods(start, k),
  // k = 0,1,… (платёж №1 = сам старт).
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

const WEEKDAYS = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

// Готовая «витрина» для дашборда — всё, что показываем арендатору.
export type CabinetView = {
  type: string;
  isBuyout: boolean;
  weekly: number;
  contract: string;
  startDate: string; // дд.мм.гггг
  completed: boolean;
  // следующий платёж (если не завершён)
  nextDate: string | null;
  nextWeekday: string | null;
  nextNumber: number | null;
  daysUntil: number | null;
  overdue: boolean;
  // прогресс выкупа
  buyoutWeeks: number | null;
  paidCount: number | null;
  remainingWeeks: number | null;
  remainingAmount: number | null;
  progressPct: number | null;
  buyoutSum: number | null; // полная выкупная сумма (с позициями «в выкуп»)
  // пауза выкупа
  paused: boolean;
  pauseFee: number | null;
  // доп. позиции
  positions: TenantPosition[];
};

export function buildCabinetView(tenant: Tenant, todayNum = mskDayNum()): CabinetView {
  const { dueNum, paymentNumber, completed } = nextDue(tenant, todayNum);
  const isBuyout = Boolean(tenant.buyoutWeeks);

  // Платежей внесено до ближайшего предстоящего: paymentNumber - 1.
  // При завершённом выкупе клампим к общему числу недель.
  const rawPaid = paymentNumber - 1;
  const paidCount = isBuyout
    ? Math.min(Math.max(rawPaid, 0), tenant.buyoutWeeks as number)
    : Math.max(rawPaid, 0);

  const remainingWeeks = isBuyout
    ? Math.max((tenant.buyoutWeeks as number) - paidCount, 0)
    : null;

  const daysUntil = completed ? null : dueNum - todayNum;

  return {
    type: tenant.type,
    isBuyout,
    weekly: effectiveWeekly(tenant),
    contract: tenant.contract,
    startDate: formatDay(isoToDayNum(tenant.startDate)),
    completed,
    nextDate: completed ? null : formatDay(dueNum),
    nextWeekday: completed
      ? null
      : WEEKDAYS[new Date(dueNum * 86400000).getUTCDay()],
    nextNumber: completed ? null : paymentNumber,
    daysUntil,
    overdue: daysUntil !== null && daysUntil < 0,
    buyoutWeeks: isBuyout ? (tenant.buyoutWeeks as number) : null,
    paidCount: isBuyout ? paidCount : null,
    remainingWeeks,
    remainingAmount:
      remainingWeeks !== null ? remainingWeeks * effectiveWeekly(tenant) : null,
    progressPct:
      isBuyout && tenant.buyoutWeeks
        ? Math.round((paidCount / (tenant.buyoutWeeks as number)) * 100)
        : null,
    buyoutSum: buyoutTotal(tenant),
    paused: Boolean(tenant.pausedSince),
    pauseFee: isBuyout ? PAUSE_FEE_MONTHLY : null,
    positions: tenant.positions ?? [],
  };
}

function weekdayOf(dayNum: number): string {
  return WEEKDAYS[new Date(dayNum * 86400000).getUTCDay()];
}

// --- Ближайший платёж арендатора (для сортировки в кабинете владельца) ---

export type NextPayment = {
  tenant: Tenant;
  dueNum: number;
  date: string; // дд.мм.гггг
  weekday: string;
  number: number; // порядковый номер платежа
  amount: number;
  daysUntil: number;
  completed: boolean; // выкуп выплачен — платежей больше нет
};

export function nextPayment(tenant: Tenant, todayNum = mskDayNum()): NextPayment {
  const { dueNum, paymentNumber, completed } = nextDue(tenant, todayNum);
  return {
    tenant,
    dueNum,
    date: formatDay(dueNum),
    weekday: weekdayOf(dueNum),
    number: paymentNumber,
    amount: effectiveWeekly(tenant),
    daysUntil: dueNum - todayNum,
    completed,
  };
}

// Ближайшие платежи по всем арендаторам, отсортированы по дате (раньше —
// выше). Завершённые выкупы исключаются. Для кабинета владельца.
export function upcomingPayments(
  tenants: Tenant[],
  todayNum = mskDayNum(),
): NextPayment[] {
  return tenants
    .map((t) => nextPayment(t, todayNum))
    .filter((p) => !p.completed)
    .sort((a, b) => a.dueNum - b.dueNum);
}

// --- Прогноз поступлений (для кабинета владельца) ----------------------

// Одно запланированное недельное поступление.
export type PaymentEvent = {
  dateISO: string; // YYYY-MM-DD — для сравнения и <input type=date>
  dateLabel: string; // дд.мм.гггг
  weekday: string;
  amount: number;
  tenantId: string;
  name: string;
};

// Все будущие недельные платежи на горизонте (по умолчанию ~квартал) вперёд
// от сегодня — основа калькулятора «сколько должно быть собрано к дате».
// На паузе и завершённые выкупы пропускаем: недельных поступлений у них нет.
export function upcomingPaymentEvents(
  tenants: Tenant[],
  horizonDays = 92,
  todayNum = mskDayNum(),
): PaymentEvent[] {
  const events: PaymentEvent[] = [];
  const horizon = todayNum + horizonDays;
  for (const t of tenants) {
    if (t.pausedSince) continue;
    const { paymentNumber, completed } = nextDue(t, todayNum);
    if (completed) continue;
    const startNum = accrualStartNum(t, todayNum);
    const period = periodOf(t);
    const weekly = effectiveWeekly(t);
    const total = t.buyoutWeeks ?? Infinity;
    let n = paymentNumber;
    while (n <= total) {
      const d = addPeriods(startNum, period, n - 1);
      if (d > horizon) break;
      events.push({
        dateISO: dayNumToIso(d),
        dateLabel: formatDay(d),
        weekday: weekdayOf(d),
        amount: weekly,
        tenantId: t.id,
        name: t.name,
      });
      n += 1;
    }
  }
  return events.sort((a, b) => (a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0));
}

// --- График платежей арендатора (для личного кабинета) ----------------

export type ScheduleRow = {
  number: number;
  date: string;
  weekday: string;
  amount: number;
  status: "past" | "next" | "upcoming";
};

// Полный график для выкупа (все недели). Для бессрочной аренды график
// открытый — показываем окно: пару прошедших + upcomingWindow будущих.
export function buildSchedule(
  tenant: Tenant,
  todayNum = mskDayNum(),
  upcomingWindow = 8,
): ScheduleRow[] {
  const startNum = accrualStartNum(tenant, todayNum);
  const period = periodOf(tenant);
  const { dueNum: nextNum, paymentNumber: nextNumber } = nextDue(tenant, todayNum);

  let from = 1;
  let to: number;
  if (tenant.buyoutWeeks) {
    to = tenant.buyoutWeeks;
  } else {
    from = Math.max(1, nextNumber - 2);
    to = nextNumber + upcomingWindow - 1;
  }

  const weekly = effectiveWeekly(tenant);
  const rows: ScheduleRow[] = [];
  for (let n = from; n <= to; n += 1) {
    const d = addPeriods(startNum, period, n - 1);
    rows.push({
      number: n,
      date: formatDay(d),
      weekday: weekdayOf(d),
      amount: weekly,
      status: d < todayNum ? "past" : d === nextNum ? "next" : "upcoming",
    });
  }
  return rows;
}

// --- Статус оплат (для кабинета владельца) ----------------------------
// Учитывает фактически отмеченные оплаты (paidThrough из lib/payments).

export type PayKind = "overdue" | "partial" | "today" | "upcoming" | "done";

export type PaymentState = {
  paidThrough: number; // сколько платежей подтверждено
  totalWeeks: number | null; // для выкупа — всего недель
  overdueCount: number; // сколько ПОЛНОСТЬЮ неоплаченных просроченных платежей
  overdueAmount: number;
  completed: boolean; // выкуп выплачен полностью
  // следующий НЕоплаченный платёж (если не завершён)
  nextNumber: number | null;
  nextDate: string | null;
  nextWeekday: string | null;
  nextDaysUntil: number | null;
  amount: number; // недельный платёж
  kind: PayKind;
  paused: boolean; // выкуп на паузе (график заморожен)
  pauseFee: number; // плата за паузу в месяц (PAUSE_FEE_MONTHLY)
  partialPaid: number; // внесено за текущую неделю (₽), но недостаточно для полной
  partialDebt: number; // недоплата за текущую неделю (₽) — мягкий долг
};

export function paymentState(
  tenant: Tenant,
  paidThrough: number,
  todayNum = mskDayNum(),
  partialPaid = 0,
): PaymentState {
  const startNum = accrualStartNum(tenant, todayNum);
  const period = periodOf(tenant);
  const total = tenant.buyoutWeeks ?? Infinity;
  const weekly = effectiveWeekly(tenant);

  // Платежи со сроком СТРОГО до сегодня (платёж «на сегодня» ещё не просрочен).
  let pastDue = 0;
  if (todayNum > startNum) {
    const e = periodsElapsed(startNum, period, todayNum);
    pastDue = addPeriods(startNum, period, e) < todayNum ? e + 1 : e;
  }
  const dueCount = Math.min(pastDue, total);

  const paid = Math.max(0, Math.min(paidThrough, total === Infinity ? paidThrough : total));
  const completed = tenant.buyoutWeeks ? paid >= tenant.buyoutWeeks : false;

  // Частичная оплата идёт в текущую неделю (paid+1). Если эта неделя уже
  // наступила — она НЕ критична (мягкая недоплата), а не красная просрочка.
  const partial = completed ? 0 : Math.max(0, partialPaid);
  const partialDebt = partial > 0 ? Math.max(0, weekly - partial) : 0;
  const partialCoversDue = partial > 0 && pastDue >= paid + 1;
  const overdueCount = Math.max(0, dueCount - paid - (partialCoversDue ? 1 : 0));

  let nextNumber: number | null = null;
  let nextDate: string | null = null;
  let nextWeekday: string | null = null;
  let nextDaysUntil: number | null = null;
  if (!completed) {
    nextNumber = paid + 1;
    const nextDueNum = addPeriods(startNum, period, nextNumber - 1);
    nextDate = formatDay(nextDueNum);
    nextWeekday = weekdayOf(nextDueNum);
    nextDaysUntil = nextDueNum - todayNum;
  }

  let kind: PayKind = "upcoming";
  if (completed) kind = "done";
  else if (overdueCount > 0) kind = "overdue";
  else if (partial > 0) kind = "partial";
  else if (nextDaysUntil === 0) kind = "today";

  return {
    paidThrough: paid,
    totalWeeks: tenant.buyoutWeeks ?? null,
    overdueCount,
    overdueAmount: overdueCount * weekly,
    completed,
    nextNumber,
    nextDate,
    nextWeekday,
    nextDaysUntil,
    amount: weekly,
    kind,
    paused: Boolean(tenant.pausedSince),
    pauseFee: PAUSE_FEE_MONTHLY,
    partialPaid: partial,
    partialDebt,
  };
}
