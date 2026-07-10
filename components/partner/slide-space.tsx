"use client";

// СЛАЙД 3 — ПОМЕЩЕНИЕ КАК ТРАСТ.
// Цель: снять возражение «зачем аренда помещения на старте». Помещение —
// не прихоть, а показатель безопасности: покупателю и клиенту есть куда
// прийти. Тёмный слайд, четыре закрытых вопроса.

import type { ReactNode } from "react";
import { Eyebrow, Punch, Rise, Slide, SlideBody } from "@/components/invest/primitives";

const CLOSED: { q: string; a: ReactNode }[] = [
  {
    q: "«А если брак?»",
    a: <>Есть адрес, куда прийти. Живой сервис вместо «переписки в&nbsp;личке».</>,
  },
  {
    q: "Где хранить парк?",
    a: <>Своё место под велосипеды и&nbsp;АКБ — ничего не&nbsp;мокнет во&nbsp;дворе.</>,
  },
  {
    q: "Где собирать и чинить?",
    a: <>Мастерская: сборка, ремонт и&nbsp;тюнинг под одной крышей.</>,
  },
  {
    q: "Можно ли доверять?",
    a: <>Физическая точка = траст. Покупатель и&nbsp;арендатор видят, что мы всерьёз.</>,
  },
];

export function SlideSpace({ index = "02" }: { index?: string } = {}) {
  return (
    <Slide id="space" theme="dark">
      <Rise>
        <Eyebrow index={index}>Помещение</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 max-w-[24ch] font-sans text-display-2">
        Помещение — не&nbsp;прихоть, а&nbsp;<span className="text-volt">безопасность</span>.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[56ch] font-sans text-body-lg text-mute">
        Точка на&nbsp;карте закрывает главный страх покупателя и&nbsp;клиента —
        «куда я&nbsp;приду, если что-то не&nbsp;так». Это больше траста и&nbsp;больше
        продаж.
      </Rise>

      <SlideBody className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {CLOSED.map((c, i) => (
            <Rise key={c.q} delay={0.12 + i * 0.06} className="h-full">
              <div className="flex h-full items-start gap-4 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5 sm:p-6">
                <span aria-hidden className="mt-1 font-mono text-h3 leading-none text-volt">✓</span>
                <div className="flex flex-col">
                  <h3 className="font-sans text-h3">{c.q}</h3>
                  <p className="mt-2 font-sans text-body leading-snug text-mute">{c.a}</p>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </SlideBody>

      <Punch className="mt-8" marker="вывод">
        Помещение = точка доверия. Покупатель платит спокойнее, когда знает,
        куда прийти — и&nbsp;возвращается.
      </Punch>
    </Slide>
  );
}
