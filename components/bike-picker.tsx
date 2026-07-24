"use client";

// Контролируемый выбор комплектации: модель + комплект АКБ + срок выкупа.
// Используется на лендинге (configurator-section) и переносится в форму
// заявки один-в-один — источник цифр общий (BUYOUT_CONFIGS в lib/bikes.ts),
// поэтому цена на сайте и в заявке не могут разъехаться.

import Image from "next/image";
import {
  BIKE_MODELS,
  BUYOUT_CONFIGS,
  getBuyoutConfig,
  getBuyoutPlan,
  modelImage,
  modelName,
  fmtRub,
  rentWeekly,
  type BikeModelKey,
  type BuyoutConfigKey,
} from "@/lib/bikes";

function weekWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "неделя";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "недели";
  return "недель";
}

// Активное состояние — контурное (чёрное на светлой теме, белое на тёмной).
// Без заливки: цветная подложка на светлом фоне выглядит грязно.
const cardCls = (active: boolean, disabled = false) =>
  `rounded-lg border text-left transition-colors duration-quick ${
    disabled
      ? "cursor-not-allowed border-[var(--line)] opacity-55"
      : active
        ? "border-[var(--text)] ring-1 ring-[var(--text)]"
        : "border-[var(--line-strong)] hover:border-[var(--text)]"
  }`;

export function BikePicker({
  model,
  mode,
  configKey,
  weeks,
  onModel,
  onMode,
  onConfig,
  onWeeks,
  showPrice = true,
}: {
  model: BikeModelKey;
  mode: "rent" | "buyout";
  configKey: BuyoutConfigKey;
  weeks: number;
  onModel: (m: BikeModelKey) => void;
  onMode: (m: "rent" | "buyout") => void;
  onConfig: (c: BuyoutConfigKey) => void;
  onWeeks: (w: number) => void;
  showPrice?: boolean;
}) {
  const cfg = getBuyoutConfig(configKey) ?? BUYOUT_CONFIGS[0];
  const plan = getBuyoutPlan(cfg, weeks);
  const weeklyNow = mode === "buyout" ? plan.weekly : rentWeekly(cfg);

  return (
    <div className="flex flex-col gap-6">
      {/* Тип сделки */}
      <div>
        <p className="font-mono text-caption uppercase text-mute">Что оформляем</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onMode("buyout")} className={`p-4 ${cardCls(mode === "buyout")}`}>
            <span className="block text-h3 text-[var(--text)]">Выкуп</span>
            <span className="mt-1 block font-mono text-caption uppercase text-mute">Велосипед станет твоим</span>
          </button>
          <button type="button" onClick={() => onMode("rent")} className={`p-4 ${cardCls(mode === "rent")}`}>
            <span className="block text-h3 text-[var(--text)]">Аренда</span>
            <span className="mt-1 block font-mono text-caption uppercase text-mute">Понедельно, без срока</span>
          </button>
        </div>
      </div>

      {/* Изображение выбранной модели */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[var(--bg)]">
        <Image
          key={model}
          src={modelImage(model)}
          alt={modelName(model)}
          fill
          sizes="(max-width: 768px) 100vw, 760px"
          className="object-cover"
        />
        <span className="absolute left-3 top-3 rounded-pill bg-[var(--bg)]/85 px-3 py-1 font-mono text-caption uppercase text-[var(--text)] backdrop-blur-sm">
          {modelName(model)}
        </span>
      </div>

      {/* Модель */}
      <div>
        <p className="font-mono text-caption uppercase text-mute">Модель</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BIKE_MODELS.map((m) => {
            const disabled = !m.available;
            return (
              <button
                key={m.key}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onModel(m.key)}
                className={`relative p-4 ${cardCls(m.key === model, disabled)}`}
              >
                {disabled && (
                  <span className="absolute right-3 top-3 rounded-pill border border-[var(--line-strong)] px-2 py-0.5 text-[10px] uppercase text-mute">
                    под заказ
                  </span>
                )}
                <span className="block text-body-lg font-semibold text-[var(--text)]">{m.name}</span>
                <span className="mt-1 block font-mono text-caption uppercase text-mute">{m.power}</span>
                <span className="mt-2 block text-body text-mute">{m.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Комплект АКБ — реальные варианты, те же что в заявке */}
      <div>
        <p className="font-mono text-caption uppercase text-mute">Аккумуляторы</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BUYOUT_CONFIGS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onConfig(c.key)}
              className={`p-4 ${cardCls(c.key === cfg.key)}`}
            >
              <span className="block font-mono text-body-lg font-semibold tabular-nums text-[var(--text)]">
                {c.batteryCount === 1 ? c.batteryParams : `${c.batteryCount} × ${c.batteryParams}`}
              </span>
              <span className="mt-1 block font-mono text-caption uppercase text-mute">
                {c.brand ? `${c.brand} · ` : ""}
                {c.range}
              </span>
              <span className="mt-1 block text-body text-mute">{c.topSpeed}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Срок выкупа — только для выкупа; аренда бессрочная */}
      <div className={mode === "buyout" ? "" : "hidden"}>
        <p className="font-mono text-caption uppercase text-mute">Срок выкупа</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cfg.plans.map((p) => (
            <button
              key={p.weeks}
              type="button"
              onClick={() => onWeeks(p.weeks)}
              className={`p-4 ${cardCls(p.weeks === plan.weeks)}`}
            >
              <span className="block text-h3 text-[var(--text)]">
                {p.weeks} {weekWord(p.weeks)}
              </span>
              <span className="mt-1 block font-mono text-caption uppercase text-mute">
                {fmtRub(p.weekly)} ₽ / неделя
              </span>
            </button>
          ))}
        </div>
      </div>

      {showPrice && (
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--line)] pt-4">
          <span className="text-h3 text-[var(--text)]">{fmtRub(weeklyNow)} ₽ / неделя</span>
          <span className="font-mono text-caption uppercase text-mute">
            {mode === "buyout" ? `выкуп · ${plan.weeks} нед` : "аренда · бессрочно"} · залог{" "}
            {fmtRub(cfg.deposit)} ₽
          </span>
        </div>
      )}
    </div>
  );
}
