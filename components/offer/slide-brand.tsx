"use client";

// ОБЪЕДИНЁННЫЙ ДЕК · СЛАЙД 3 — НЕ ПРОКАТ, А БРЕНД.
// Позиционирование + как делаем деньги (выкуп + продажа). Тёмный слайд.

import type { ReactNode } from "react";
import { Eyebrow, Punch, R, Rise, Slide, SlideBody } from "@/components/invest/primitives";

export function SlideBrand() {
  return (
    <Slide id="brand" theme="dark">
      <Rise>
        <Eyebrow index="02">Бренд</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[22ch] font-sans text-display-2">
        Не прокат. Бренд, который закрепляется в&nbsp;нише.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[58ch] font-sans text-body-lg text-mute">
        Аренда и&nbsp;выкуп — быстрый способ зайти и&nbsp;набрать базу. Продажа
        и&nbsp;сервис — маржа. Бренд — то, что держит нишу надолго.
      </Rise>

      <SlideBody className="mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Rise delay={0.12} className="h-full">
            <div className="flex h-full flex-col rounded-lg border border-volt/40 bg-[var(--bg-2)] p-5 sm:p-6">
              <span className="font-mono text-caption uppercase text-volt">Основа</span>
              <h3 className="mt-4 font-sans text-h3">Выкуп в рассрочку</h3>
              <div className="mt-4 flex flex-col gap-1.5 font-mono text-caption uppercase text-mute">
                <FlowRow k="Велосипед" v={<>~110&nbsp;000&nbsp;<R /></>} />
                <FlowRow k="Платёж клиента" v={<>5 500&nbsp;<R />/нед</>} />
                <FlowRow k="Выкуп за ~10 мес" v={<>~220–231&nbsp;тыс.&nbsp;<R /></>} />
              </div>
              <div className="mt-auto pt-6">
                <span className="font-mono text-caption uppercase text-mute">Маржа с договора</span>
                <div className="mt-1 font-mono tnum text-[clamp(28px,3.4vw,44px)] leading-none tracking-tight text-volt">
                  ~120 000&nbsp;<R />
                </div>
              </div>
            </div>
          </Rise>

          <Rise delay={0.18} className="h-full">
            <div className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5 sm:p-6">
              <span className="font-mono text-caption uppercase text-mute">Плюс к обороту</span>
              <h3 className="mt-4 font-sans text-h3">Продажа и сервис</h3>
              <ul className="mt-5 flex flex-col gap-3 font-sans text-body text-mute">
                <Bullet><span className="text-[var(--text)]">+15 000 <R /></span> с каждого проданного велика</Bullet>
                <Bullet>Своё помещение-мастерская — траст и качество</Bullet>
                <Bullet>Свой стандарт: чиним, собираем, тюнингуем</Bullet>
              </ul>
              <p className="mt-auto pt-5 font-mono text-caption uppercase leading-relaxed text-mute">
                Связи с&nbsp;дарксторами · лучшая цена · инфраструктура бренда
              </p>
            </div>
          </Rise>
        </div>
      </SlideBody>

      <Punch className="mt-8" marker="защита">
        Схему легко скопировать. Бренд с&nbsp;лучшей ценой и&nbsp;своим сервисом — нет.
        Именно это закрывает нишу.
      </Punch>
    </Slide>
  );
}

function FlowRow({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-1.5 last:border-0">
      <span>{k}</span>
      <span className="tnum text-right text-[var(--text)]">{v}</span>
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-3">
      <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 bg-volt" />
      <span>{children}</span>
    </li>
  );
}
