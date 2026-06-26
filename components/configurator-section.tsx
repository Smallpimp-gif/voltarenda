"use client";

// Блок-конфигуратор на лендинге: выбор модели + АКБ с примерной ценой.
// «Оформить» открывает форму заявки с предзаполненным выбором.

import { useState } from "react";
import { useApply } from "./apply";
import { BikePicker } from "./bike-picker";
import { DEFAULT_MODEL, DEFAULT_BATTERY, type BikeModelKey, type BatteryKey } from "@/lib/bikes";

export function ConfiguratorSection() {
  const { open } = useApply();
  const [model, setModel] = useState<BikeModelKey>(DEFAULT_MODEL);
  const [battery, setBattery] = useState<BatteryKey>(DEFAULT_BATTERY);

  return (
    <section
      id="configurator"
      data-theme="light"
      className="bg-[var(--bg)] py-section-y text-[var(--text)]"
    >
      <div className="mx-auto max-w-content px-gutter">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-caption uppercase text-mute">Конфигуратор</span>
          <h2 className="text-h2 text-[var(--text)]">Собери свой велосипед</h2>
          <p className="mt-2 max-w-[52ch] text-body-lg text-mute">
            Модель и аккумуляторы — под твои задачи. Цена примерная; аренду или
            выкуп и финальную стоимость подберёт оператор.
          </p>
        </div>

        <div className="mt-10 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-8">
          <BikePicker
            model={model}
            battery={battery}
            onModel={setModel}
            onBattery={setBattery}
          />

          <button
            type="button"
            onClick={() => {
              try {
                (window as any).ym?.(108583356, "reachGoal", "CONFIGURATOR_APPLY", {
                  model,
                  battery,
                });
              } catch {}
              open(undefined, { bikeModel: model, battery });
            }}
            className="btn-cta btn-cta-volt mt-8 w-full rounded-md bg-volt px-8 py-5 font-mono text-caption uppercase text-ink hover:bg-volt-hover sm:w-auto"
          >
            Оформить эту комплектацию →
          </button>
        </div>
      </div>
    </section>
  );
}
