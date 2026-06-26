// Конфигуратор велосипеда: модель + АКБ. Источник истины для лендинга
// и формы заявки.
//
// ВНИМАНИЕ: цены ниже — ПРИМЕРНЫЕ ПЛЕЙСХОЛДЕРЫ. Замени на реальные.
// Онлайн-оплаты нет — это «примерная стоимость по неделям» (аренда),
// финальную цену и условия выкупа называет оператор.

export type BikeModelKey = "u2" | "u2pro" | "u7";
export type BatteryKey = "1x30" | "1x60" | "2x60-30" | "2x60-60";

export type BikeModel = {
  key: BikeModelKey;
  name: string;
  power: string;
  note: string;
  image: string; // фото модели
};

export type BatteryOption = {
  key: BatteryKey;
  label: string;
  short: string; // компактная подпись
  count: 1 | 2;
  range: string; // ориентировочный пробег
};

// image: пока всем стоит /rider.webp (плейсхолдер). Положи реальные фото
// моделей в public/bikes/ и поменяй пути (напр. /bikes/u2.webp).
export const BIKE_MODELS: BikeModel[] = [
  { key: "u2", name: "ВОЛЬТ U2", power: "1500 Вт", note: "Базовая для курьера", image: "/rider.webp" },
  { key: "u2pro", name: "ВОЛЬТ U2 Pro", power: "2000 Вт", note: "Мощнее: груз и подъёмы", image: "/rider.webp" },
  { key: "u7", name: "ВОЛЬТ U7", power: "2000 Вт", note: "Флагман, макс. комфорт", image: "/rider.webp" },
];

export function modelImage(key: BikeModelKey): string {
  return BIKE_MODELS.find((m) => m.key === key)?.image ?? "/rider.webp";
}

export const BATTERIES: BatteryOption[] = [
  { key: "1x30", label: "1 АКБ · 30 Ач", short: "30", count: 1, range: "~30 км" },
  { key: "1x60", label: "1 АКБ · 60 Ач", short: "60", count: 1, range: "~60 км" },
  { key: "2x60-30", label: "2 АКБ · 60+30 Ач", short: "60+30", count: 2, range: "~90 км" },
  { key: "2x60-60", label: "2 АКБ · 60+60 Ач", short: "60+60", count: 2, range: "~120 км" },
];

export const DEFAULT_MODEL: BikeModelKey = "u2";
export const DEFAULT_BATTERY: BatteryKey = "2x60-30";

// ── Примерная стоимость аренды, ₽/неделя ─────────────────────────────
// ПЛЕЙСХОЛДЕРЫ. База U2 + 2 АКБ 60+30 = 5500 ₽/нед (как тариф «Неделя»).
const MODEL_WEEKLY: Record<BikeModelKey, number> = {
  u2: 5500,
  u2pro: 6500,
  u7: 7500,
};

// Поправка за конфигурацию АКБ, ₽/неделя.
const BATTERY_WEEKLY: Record<BatteryKey, number> = {
  "1x30": -1000,
  "1x60": -500,
  "2x60-30": 0,
  "2x60-60": 800,
};

export function approxWeekly(model: BikeModelKey, battery: BatteryKey): number {
  return Math.max(0, MODEL_WEEKLY[model] + BATTERY_WEEKLY[battery]);
}

export function modelName(key: BikeModelKey): string {
  return BIKE_MODELS.find((m) => m.key === key)?.name ?? key;
}

export function batteryLabel(key: BatteryKey): string {
  return BATTERIES.find((b) => b.key === key)?.label ?? key;
}

const rub = new Intl.NumberFormat("ru-RU");
export function approxWeeklyLabel(model: BikeModelKey, battery: BatteryKey): string {
  return `≈ ${rub.format(approxWeekly(model, battery))} ₽ / неделя`;
}
