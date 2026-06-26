// Расчёт дат недельных платежей — TS-порт bot/lib/schedule.mjs для кабинета.
// Всё в целых «днях по МСК», чтобы не зависеть от времени суток и часового
// пояса: и дату заезда, и сегодня сводим к календарному дню в Europe/Moscow
// и считаем разницу в днях. У МСК нет перехода на летнее время (UTC+3 с 2014),
// поэтому целочисленная арифметика дней безопасна.
//
// Бот (bot/lib/schedule.mjs) держит свою копию намеренно — он отдельный
// процесс на .mjs без сборки. Логика nextDue идентична; менять надо обе.

export type Tenant = {
  id: string;
  name: string; // фамилия
  contract: string;
  type: "аренда" | "выкуп" | string;
  weekly: number;
  startDate: string; // YYYY-MM-DD
  buyoutWeeks: number | null;
  telegramUsername?: string;
  // Пауза выкупа: пока на паузе, график заморожен (выкупная сумма не идёт),
  // вместо недельных — фикс. плата за паузу (PAUSE_FEE_MONTHLY), отдельно.
  pausedSince?: string | null; // ISO YYYY-MM-DD — дата постановки на паузу
  pausedDays?: number; // накоплено дней паузы из завершённых периодов
};

// Плата за паузу выкупа — фикс., в месяц, отдельно от выкупной суммы.
export const PAUSE_FEE_MONTHLY = 11000;

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
  tenant: Pick<Tenant, "startDate" | "buyoutWeeks" | "pausedSince" | "pausedDays">,
  todayNum: number,
): { dueNum: number; paymentNumber: number; completed: boolean } {
  const startNum = accrualStartNum(tenant, todayNum);
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
  // пауза выкупа
  paused: boolean;
  pauseFee: number | null;
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
    weekly: tenant.weekly,
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
    remainingAmount: remainingWeeks !== null ? remainingWeeks * tenant.weekly : null,
    progressPct:
      isBuyout && tenant.buyoutWeeks
        ? Math.round((paidCount / (tenant.buyoutWeeks as number)) * 100)
        : null,
    paused: Boolean(tenant.pausedSince),
    pauseFee: isBuyout ? PAUSE_FEE_MONTHLY : null,
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
    amount: tenant.weekly,
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
  const { dueNum: nextNum } = nextDue(tenant, todayNum);
  const nextNumber = Math.round((nextNum - startNum) / 7) + 1;

  let from = 1;
  let to: number;
  if (tenant.buyoutWeeks) {
    to = tenant.buyoutWeeks;
  } else {
    from = Math.max(1, nextNumber - 2);
    to = nextNumber + upcomingWindow - 1;
  }

  const rows: ScheduleRow[] = [];
  for (let n = from; n <= to; n += 1) {
    const d = startNum + (n - 1) * 7;
    rows.push({
      number: n,
      date: formatDay(d),
      weekday: weekdayOf(d),
      amount: tenant.weekly,
      status: d < todayNum ? "past" : d === nextNum ? "next" : "upcoming",
    });
  }
  return rows;
}

// --- Статус оплат (для кабинета владельца) ----------------------------
// Учитывает фактически отмеченные оплаты (paidThrough из lib/payments).

export type PayKind = "overdue" | "today" | "upcoming" | "done";

export type PaymentState = {
  paidThrough: number; // сколько платежей подтверждено
  totalWeeks: number | null; // для выкупа — всего недель
  overdueCount: number; // сколько просроченных неоплаченных платежей
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
};

export function paymentState(
  tenant: Tenant,
  paidThrough: number,
  todayNum = mskDayNum(),
): PaymentState {
  const startNum = accrualStartNum(tenant, todayNum);
  const total = tenant.buyoutWeeks ?? Infinity;

  // Платежи со сроком СТРОГО до сегодня (платёж «на сегодня» ещё не просрочен).
  const pastDue =
    todayNum > startNum ? Math.floor((todayNum - startNum - 1) / 7) + 1 : 0;
  const dueCount = Math.min(pastDue, total);

  const paid = Math.max(0, Math.min(paidThrough, total === Infinity ? paidThrough : total));
  const completed = tenant.buyoutWeeks ? paid >= tenant.buyoutWeeks : false;

  const overdueCount = Math.max(0, dueCount - paid);

  let nextNumber: number | null = null;
  let nextDate: string | null = null;
  let nextWeekday: string | null = null;
  let nextDaysUntil: number | null = null;
  if (!completed) {
    nextNumber = paid + 1;
    const nextDueNum = startNum + (nextNumber - 1) * 7;
    nextDate = formatDay(nextDueNum);
    nextWeekday = weekdayOf(nextDueNum);
    nextDaysUntil = nextDueNum - todayNum;
  }

  let kind: PayKind = "upcoming";
  if (completed) kind = "done";
  else if (overdueCount > 0) kind = "overdue";
  else if (nextDaysUntil === 0) kind = "today";

  return {
    paidThrough: paid,
    totalWeeks: tenant.buyoutWeeks ?? null,
    overdueCount,
    overdueAmount: overdueCount * tenant.weekly,
    completed,
    nextNumber,
    nextDate,
    nextWeekday,
    nextDaysUntil,
    amount: tenant.weekly,
    kind,
    paused: Boolean(tenant.pausedSince),
    pauseFee: PAUSE_FEE_MONTHLY,
  };
}
