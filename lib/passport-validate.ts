// Маски и строгая валидация паспортных/личных данных заявки.
// Единый источник истины: используется и на клиенте (components/apply.tsx —
// маски ввода + проверка шага), и на сервере (app/api/apply/submit —
// чтобы нельзя было отправить мусор в обход формы).
//
// Цель — не дать заполнить «на отъебись»: серия ровно 4 цифры, номер 6,
// код 000-000, даты реальные, ФИО и адреса — осмысленные.

export type PassportInput = {
  series?: string;
  number?: string;
  birthDate?: string;
  birthPlace?: string;
  issueDate?: string;
  departmentCode?: string;
  issuedBy?: string;
};

export type PersonalInput = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  regAddress?: string;
  currentAddress?: string;
};

// --- Маски ввода (клиент) ---------------------------------------------

export function digitsOnly(v: string, max: number): string {
  return v.replace(/\D/g, "").slice(0, max);
}

// «0000» — до 4 цифр.
export function maskSeries(v: string): string {
  return digitsOnly(v, 4);
}

// «000000» — до 6 цифр.
export function maskNumber(v: string): string {
  return digitsOnly(v, 6);
}

// «000-000» — 6 цифр с дефисом после третьей.
export function maskDeptCode(v: string): string {
  const d = digitsOnly(v, 6);
  return d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d;
}

// «дд.мм.гггг» — до 8 цифр с точками.
export function maskDate(v: string): string {
  const d = digitsOnly(v, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter((p, i) => i === 0 || p.length > 0);
  return parts.join(".");
}

// --- Разбор и проверки ------------------------------------------------

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

// Возвращает Date (UTC-полдень, чтобы не ловить сдвиги TZ) или null, если
// строка не «дд.мм.гггг» или дата несуществующая (напр. 31.02.2000).
export function parseRuDate(s: string): Date | null {
  const m = DATE_RE.exec(s.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d;
}

function yearsBetween(from: Date, to: Date): number {
  let age = to.getUTCFullYear() - from.getUTCFullYear();
  const mo = to.getUTCMonth() - from.getUTCMonth();
  if (mo < 0 || (mo === 0 && to.getUTCDate() < from.getUTCDate())) age--;
  return age;
}

// Хотя бы 2 буквенных символа (кириллица/латиница) — отсекает «---», «...».
function hasWords(s: string, min = 2): boolean {
  const letters = (s.match(/\p{L}/gu) ?? []).length;
  return letters >= min;
}

// ФИО: буквы, пробел, дефис, точка; минимум 2 буквы.
const NAME_RE = /^[\p{L}][\p{L}\s.\-]*$/u;
function isName(s: string): boolean {
  const t = s.trim();
  return t.length >= 2 && NAME_RE.test(t) && hasWords(t);
}

// --- Публичные валидаторы (возвращают массив ошибок) ------------------

/** Ошибки с привязкой к полю: { поле: сообщение }. Клиент подсвечивает
 *  конкретный инпут, сервер разворачивает в плоский список. */
export type FieldErrors = Record<string, string>;

export function validatePersonalFields(input: PersonalInput): FieldErrors {
  const e: FieldErrors = {};
  const first = (input.firstName ?? "").trim();
  const last = (input.lastName ?? "").trim();
  const middle = (input.middleName ?? "").trim();
  const reg = (input.regAddress ?? "").trim();
  const cur = (input.currentAddress ?? "").trim();

  if (!isName(first)) e.firstName = "Имя — буквами, без цифр и символов";
  if (!isName(last)) e.lastName = "Фамилия — буквами, без цифр и символов";
  if (middle && !isName(middle)) e.middleName = "Отчество — буквами, без цифр и символов";

  if (reg.length < 10 || !hasWords(reg, 3) || !/\d/.test(reg))
    e.regAddress = "Как в паспорте: город, улица, дом, квартира";
  if (cur.length < 10 || !hasWords(cur, 3))
    e.currentAddress = "Город, улица, дом";

  return e;
}

export function validatePassportFields(p: PassportInput, now: Date = new Date()): FieldErrors {
  const e: FieldErrors = {};
  const series = (p.series ?? "").replace(/\D/g, "");
  const number = (p.number ?? "").replace(/\D/g, "");
  const dept = (p.departmentCode ?? "").replace(/\D/g, "");
  const issuedBy = (p.issuedBy ?? "").trim();
  const birthPlace = (p.birthPlace ?? "").trim();

  if (series.length !== 4) e.series = "4 цифры";
  if (number.length !== 6) e.number = "6 цифр";
  if (dept.length !== 6) e.departmentCode = "6 цифр: 000-000";

  const birth = parseRuDate(p.birthDate ?? "");
  if (!birth) {
    e.birthDate = "дд.мм.гггг";
  } else {
    const age = yearsBetween(birth, now);
    if (age < 18) e.birthDate = "Аренда только с 18 лет";
    else if (age > 90) e.birthDate = "Проверь дату рождения";
  }

  const issue = parseRuDate(p.issueDate ?? "");
  if (!issue) {
    e.issueDate = "дд.мм.гггг";
  } else if (issue.getTime() > now.getTime()) {
    e.issueDate = "Дата не может быть в будущем";
  } else if (birth && issue.getTime() < birth.getTime()) {
    e.issueDate = "Раньше даты рождения";
  }

  if (issuedBy.length < 8 || !hasWords(issuedBy, 4))
    e.issuedBy = "Полное наименование органа, как в паспорте";
  if (birthPlace.length < 3 || !hasWords(birthPlace, 3))
    e.birthPlace = "Как в паспорте";

  return e;
}

// Плоские списки — для сервера (app/api/apply/submit).
export function validatePersonal(input: PersonalInput): string[] {
  return Object.values(validatePersonalFields(input));
}

export function validatePassport(p: PassportInput, now: Date = new Date()): string[] {
  return Object.values(validatePassportFields(p, now));
}
