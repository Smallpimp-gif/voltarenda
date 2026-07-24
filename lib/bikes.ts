// Конфигуратор велосипеда. ЕДИНЫЙ источник истины для лендинга, формы
// заявки и договора: комплектации и цены берутся из BUYOUT_CONFIGS ниже.
//
// Плейсхолдерных цен здесь больше нет — всё, что видит клиент на сайте,
// это те же цифры, по которым он оформляет заявку и получает договор.

export type BikeModelKey = "u2" | "u2pro" | "u7";

export type BikeModel = {
  key: BikeModelKey;
  name: string;
  power: string;
  note: string;
  image: string; // фото модели
  available: boolean; // доступно ли к аренде сейчас
};

// Сейчас к аренде доступен только U2 Pro 2000 Вт с 2 АКБ 60/33 — остальное
// помечено available:false (показывается как «под заказ»).
//
// image: пока всем стоит /rider.webp (плейсхолдер). Положи реальные фото
// моделей в public/bikes/ и поменяй пути (напр. /bikes/u2.webp).
export const BIKE_MODELS: BikeModel[] = [
  { key: "u2", name: "Mingto U2", power: "1500 Вт", note: "Базовая для курьера", image: "/rider.webp", available: false },
  { key: "u2pro", name: "Mingto U2 Pro", power: "2000 Вт, контроллер 50A", note: "Мощнее: груз и подъёмы", image: "/rider.webp", available: true },
  { key: "u7", name: "Mingto U7", power: "2000 Вт", note: "Флагман, макс. комфорт", image: "/rider.webp", available: false },
];

export function modelImage(key: BikeModelKey): string {
  return BIKE_MODELS.find((m) => m.key === key)?.image ?? "/rider.webp";
}

export const DEFAULT_MODEL: BikeModelKey = "u2pro";

export function modelName(key: BikeModelKey): string {
  return BIKE_MODELS.find((m) => m.key === key)?.name ?? key;
}

const rub = new Intl.NumberFormat("ru-RU");
export const fmtRub = (n: number) => rub.format(n);

// ── Каталог выкупа ───────────────────────────────────────────────────
// Источник истины для формы заявки И для генерации договора (lib/contract.ts).
// Реально сдаём под выкуп U2 Pro 2000W (контроллер 50A) в трёх комплектациях
// АКБ. Оценочная стоимость и планы выкупа — по фактическим условиям оператора.
//
// ВАЖНО: это условия юридического договора. Меняешь цифры здесь — меняется
// и .docx, который уходит арендатору. Сверяй с эталоном (Договор №33).

export type BuyoutConfigKey = "2x60-33" | "63-65" | "74-65";

// План выкупа: еженедельный платёж × число недель. total = weekly × weeks.
export type BuyoutPlan = { weeks: number; weekly: number };

export type BuyoutConfig = {
  key: BuyoutConfigKey;
  /** Модель как в договоре (п. 1.1, таблица «Марка/модель»). */
  model: string;
  /** Кол-во АКБ в комплекте. */
  batteryCount: number;
  /** Параметры одной АКБ, как в договоре: «63V/65Ah». */
  batteryParams: string;
  /** Бренд АКБ (для UI формы; в договор не идёт). */
  brand?: string;
  /** Маркетинговый запас хода (UI формы). */
  range: string;
  /** Маркетинговая макс. скорость (UI формы; в договоре ограничитель 25 км/ч). */
  topSpeed: string;
  /** Залог, ₽ (в выкупе не взимается сверх платежей — справочно для UI). */
  deposit: number;
  /** Оценочная стоимость компонентов (договор, п. 1.3 и 4.4). batteryEach — за 1 шт. */
  valuation: { bike: number; batteryEach: number; charger: number; keysLock: number; box: number };
  /** Планы выкупа — клиент выбирает срок. Первый — по умолчанию. */
  plans: BuyoutPlan[];
};

// 74V/65Ah дороже 63V/65Ah на 12% (АКБ и еженедельный платёж). Округляем
// платёж до 10 ₽, чтобы в договоре не было копеечных чисел.
const S74 = 1.12;
const up12 = (n: number) => Math.round((n * S74) / 10) * 10;

// Аренда дороже выкупа на 10% — чтобы выкуп был выгоднее. Считаем от
// базового (первого, самого длинного) плана выкупа, округляем до 10 ₽.
const RENT_MARKUP = 1.1;
export function rentWeekly(c: BuyoutConfig): number {
  return Math.round((c.plans[0].weekly * RENT_MARKUP) / 10) * 10;
}

export const BUYOUT_CONFIGS: BuyoutConfig[] = [
  {
    key: "2x60-33",
    model: "Mingto U2 Pro",
    batteryCount: 2,
    batteryParams: "60V/33Ah",
    range: "до 140 км (2×70)",
    topSpeed: "до 70 км/ч",
    deposit: 5000,
    valuation: { bike: 77000, batteryEach: 40000, charger: 5000, keysLock: 5000, box: 5000 },
    // итого оценка: 77000 + 2×40000 + 15000 = 172 000 ₽
    plans: [
      { weeks: 40, weekly: 5500 }, // 220 000 ₽
      { weeks: 24, weekly: 8000 }, // 192 000 ₽
    ],
  },
  {
    key: "63-65",
    model: "Mingto U2 Pro",
    batteryCount: 1,
    batteryParams: "63V/65Ah",
    brand: "9A strong",
    range: "до 100 км",
    topSpeed: "до 80 км/ч",
    deposit: 5000,
    valuation: { bike: 77000, batteryEach: 90000, charger: 5000, keysLock: 5000, box: 5000 },
    // итого оценка: 77000 + 90000 + 15000 = 182 000 ₽ (эталон, Договор №33)
    plans: [
      { weeks: 40, weekly: 6000 }, // 240 000 ₽
      { weeks: 24, weekly: 8600 }, // 206 400 ₽
    ],
  },
  {
    key: "74-65",
    model: "Mingto U2 Pro",
    batteryCount: 1,
    batteryParams: "74V/65Ah",
    brand: "9A strong",
    range: "до 110 км",
    topSpeed: "до 87 км/ч",
    deposit: 5000,
    // АКБ на 12% дороже 63/65: 90000 × 1.12 = 100 800 ₽
    valuation: { bike: 77000, batteryEach: up12(90000), charger: 5000, keysLock: 5000, box: 5000 },
    // итого оценка: 77000 + 100800 + 15000 = 192 800 ₽
    plans: [
      { weeks: 40, weekly: up12(6000) }, // 6720 × 40 = 268 800 ₽
      { weeks: 24, weekly: up12(8600) }, // 9630 × 24 = 231 120 ₽
    ],
  },
];

export const DEFAULT_BUYOUT_CONFIG: BuyoutConfigKey = "63-65";

export function getBuyoutConfig(key: string | undefined): BuyoutConfig | null {
  return BUYOUT_CONFIGS.find((c) => c.key === key) ?? null;
}

/** Итоговая оценочная стоимость комплекта, ₽. */
export function buyoutValuationTotal(c: BuyoutConfig): number {
  const v = c.valuation;
  return v.bike + v.batteryEach * c.batteryCount + v.charger + v.keysLock + v.box;
}

/** Выбранный план по числу недель (fallback — первый план конфигурации). */
export function getBuyoutPlan(c: BuyoutConfig, weeks: number | undefined): BuyoutPlan {
  return c.plans.find((p) => p.weeks === weeks) ?? c.plans[0];
}

export function buyoutTotal(plan: BuyoutPlan): number {
  return plan.weekly * plan.weeks;
}

/** Подпись АКБ как в договоре: «1 шт.: 63V/65Ah». */
export function batteryContractLine(c: BuyoutConfig): string {
  return `${c.batteryCount} шт.: ${c.batteryParams}`;
}
