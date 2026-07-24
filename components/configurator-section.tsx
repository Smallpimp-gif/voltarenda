"use client";

// Блок-конфигуратор на лендинге: выбор модели + АКБ с примерной ценой.
// «Оформить» открывает форму заявки с предзаполненным выбором.

import { useState } from "react";
import { useApply } from "./apply";
import { BikePicker } from "./bike-picker";
import {
  DEFAULT_MODEL,
  DEFAULT_BUYOUT_CONFIG,
  getBuyoutConfig,
  type BikeModelKey,
  type BuyoutConfigKey,
} from "@/lib/bikes";

export function ConfiguratorSection() {
  const { open } = useApply();
  const [model, setModel] = useState<BikeModelKey>(DEFAULT_MODEL);
  const [mode, setMode] = useState<"rent" | "buyout">("buyout");
  const [configKey, setConfigKey] = useState<BuyoutConfigKey>(DEFAULT_BUYOUT_CONFIG);
  const [weeks, setWeeks] = useState<number>(
    getBuyoutConfig(DEFAULT_BUYOUT_CONFIG)!.plans[0].weeks,
  );

  // Смена комплекта АКБ: если у него нет выбранного срока — берём первый.
  const pickConfig = (key: BuyoutConfigKey) => {
    setConfigKey(key);
    const c = getBuyoutConfig(key)!;
    if (!c.plans.some((p) => p.weeks === weeks)) setWeeks(c.plans[0].weeks);
  };

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
            Аккумуляторы и срок — под твои задачи. Цена за неделю итоговая:
            с ней же оформишь заявку, ничего не поменяется.
          </p>
        </div>

        <div className="mt-10 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-8">
          <BikePicker
            model={model}
            mode={mode}
            configKey={configKey}
            weeks={weeks}
            onModel={setModel}
            onMode={setMode}
            onConfig={pickConfig}
            onWeeks={setWeeks}
          />

          <button
            type="button"
            onClick={() => {
              try {
                (window as any).ym?.(108583356, "reachGoal", "CONFIGURATOR_APPLY", {
                  model,
                  mode,
                  config: configKey,
                  weeks,
                });
              } catch {}
              // Выбор с лендинга переносится в форму — человек не выбирает дважды.
              open(undefined, { mode, buyoutConfig: configKey, buyoutWeeks: weeks });
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
