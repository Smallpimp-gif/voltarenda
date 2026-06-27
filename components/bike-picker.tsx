"use client";

// Контролируемый выбор модели + АКБ. Используется и на лендинге
// (configurator-section), и в форме заявки (StepTariff). Стиль —
// токены сайта (volt-акцент, mono-капс, радиусы).

import Image from "next/image";
import {
  BIKE_MODELS,
  BATTERIES,
  approxWeeklyLabel,
  modelImage,
  modelName,
  type BikeModelKey,
  type BatteryKey,
} from "@/lib/bikes";

export function BikePicker({
  model,
  battery,
  onModel,
  onBattery,
  showPrice = true,
}: {
  model: BikeModelKey;
  battery: BatteryKey;
  onModel: (m: BikeModelKey) => void;
  onBattery: (b: BatteryKey) => void;
  showPrice?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
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
            const active = m.key === model;
            const disabled = !m.available;
            return (
              <button
                key={m.key}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onModel(m.key)}
                className={`relative rounded-lg border p-4 text-left transition-colors duration-quick ${
                  disabled
                    ? "cursor-not-allowed border-[var(--line)] opacity-55"
                    : active
                      ? "border-volt bg-volt/5"
                      : "border-[var(--line-strong)] hover:border-[var(--text)]"
                }`}
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

      {/* АКБ */}
      <div>
        <p className="font-mono text-caption uppercase text-mute">Аккумуляторы</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BATTERIES.map((b) => {
            const active = b.key === battery;
            const disabled = !b.available;
            return (
              <button
                key={b.key}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onBattery(b.key)}
                className={`rounded-lg border p-3 text-left transition-colors duration-quick ${
                  disabled
                    ? "cursor-not-allowed border-[var(--line)] opacity-55"
                    : active
                      ? "border-volt bg-volt/5"
                      : "border-[var(--line-strong)] hover:border-[var(--text)]"
                }`}
              >
                <span className="block font-mono text-body-lg font-semibold tabular-nums text-[var(--text)]">
                  {b.short}
                </span>
                <span className="mt-1 block font-mono text-caption uppercase text-mute">
                  {b.count === 1 ? "1 АКБ" : "2 АКБ"} · {b.range}
                </span>
                {disabled && (
                  <span className="mt-1 block text-[10px] uppercase text-mute">под заказ</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showPrice && (
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--line)] pt-4">
          <span className="font-sans text-h3 text-[var(--text)]">
            {approxWeeklyLabel(model, battery)}
          </span>
          <span className="font-mono text-caption uppercase text-mute">
            примерно · аренда или выкуп — у оператора
          </span>
        </div>
      )}
    </div>
  );
}
