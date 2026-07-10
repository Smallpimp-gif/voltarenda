"use client";

// СЛАЙД 4 — ЗАПУСК ЗА ~3 НЕДЕЛИ.
// Цель: показать короткий путь от денег до потока И то, что сборка со сдачей
// идут ПАРАЛЛЕЛЬНО — первые собранные велики уходят сразу, не ждём весь парк.
// Светлый слайд, Гант с перекрытием этапов + пруф-пойнт.

import type { ReactNode } from "react";
import { Eyebrow, Punch, Rise, Slide, SlideBody } from "@/components/invest/primitives";

// Ганта-дорожки над осью ~24 дней (100% ширины). Сборка и Сдача стартуют
// в один день (левый край совпадает) — визуальное доказательство параллели.
const ROWS: {
  name: string;
  meta: string;
  left: number;
  width: number;
  tone: "mute" | "dark" | "volt";
  desc: ReactNode;
}[] = [
  {
    name: "Помещение",
    meta: "7 дней",
    left: 0,
    width: 29,
    tone: "mute",
    desc: <>Поиск и&nbsp;подготовка, минимальный ремонт.</>,
  },
  {
    name: "Сборка",
    meta: "4–5 дней · по 5/день",
    left: 29,
    width: 21,
    tone: "dark",
    desc: <>Собираем и&nbsp;тюнингуем парк, партиями.</>,
  },
  {
    name: "Сдача",
    meta: "10–20 дней · параллельно",
    left: 29,
    width: 71,
    tone: "volt",
    desc: <>Первый собранный велик — сразу в&nbsp;работу.</>,
  },
];

const BAR_TONE: Record<string, string> = {
  mute: "bg-[var(--line-strong)]",
  dark: "bg-ink",
  volt: "bg-volt",
};

export function SlideTimeline({ index = "03" }: { index?: string } = {}) {
  return (
    <Slide id="timeline" theme="light">
      <Rise>
        <Eyebrow index={index}>Запуск</Eyebrow>
      </Rise>
      <Rise delay={0.05} blur={0} as="h2" className="mt-6 font-sans text-display-2">
        От денег до&nbsp;потока — ~3&nbsp;недели.
      </Rise>
      <Rise delay={0.1} as="p" className="mt-5 max-w-[58ch] font-sans text-body-lg text-mute">
        Помещение готовим первым. А&nbsp;сборка и&nbsp;сдача идут{" "}
        <span className="text-[var(--text)]">параллельно</span>: собрали первые
        велики — сразу отдаём, не&nbsp;ждём весь парк.
      </Rise>

      <SlideBody className="mt-8 gap-6">
        {/* Гант — перекрытие сборки и сдачи */}
        <Rise delay={0.14}>
          <GanttTimeline />
        </Rise>

        {/* Пруф-пойнт — это уже проверено на практике, теперь условия лучше */}
        <Rise delay={0.12}>
          <div className="rounded-lg border border-acc bg-[var(--bg-2)] p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="flex items-center gap-2.5 font-sans text-h3">
                <span aria-hidden className="inline-block h-2 w-2 shrink-0 bg-[var(--acc)]" />
                Уже проверено на&nbsp;практике
              </h3>
              <span className="font-mono text-caption uppercase text-mute">
                11 велосипедов · 14 дней
              </span>
            </div>
            <p className="mt-4 max-w-[76ch] font-sans text-body-lg leading-snug text-mute">
              В&nbsp;прошлый раз{" "}
              <span className="text-[var(--text)]">11&nbsp;велосипедов ушли за&nbsp;14&nbsp;дней</span> —
              и&nbsp;это без&nbsp;АКБ и&nbsp;без обработки всех лидов. Теперь есть банк АКБ
              и&nbsp;полный поток заявок — <span className="text-[var(--text)]">будет быстрее</span>.
            </p>
          </div>
        </Rise>
      </SlideBody>

      <Punch className="mt-6" marker="срок">
        Не&nbsp;по&nbsp;очереди, а&nbsp;внахлёст. Пока докатывается сборка, деньги
        с&nbsp;первых велосипедов уже идут.
      </Punch>
    </Slide>
  );
}

// Гант: три дорожки над общей осью дней. Ключ — левый край «Сборки» и «Сдачи»
// совпадает (старт в один день), а «Сдача» тянется дальше сборки → параллель
// читается глазом. Пунктирный маркер на дне 8 подписывает момент старта потока.
function GanttTimeline() {
  const LABEL = "grid-cols-[92px_1fr] gap-3 sm:grid-cols-[136px_1fr] sm:gap-4";
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5 sm:p-6">
      {/* ось дней */}
      <div className={`grid ${LABEL}`}>
        <span />
        <div className="relative h-4 font-mono text-[10px] uppercase tracking-[0.04em] text-mute">
          <span className="absolute left-0">День&nbsp;1</span>
          <span className="absolute left-[29%] -translate-x-1/2">8</span>
          <span className="absolute left-[58%] -translate-x-1/2">14</span>
          <span className="absolute right-0">~21+</span>
        </div>
      </div>

      {/* дорожки */}
      <div className="mt-1 flex flex-col gap-2.5">
        {ROWS.map((r) => (
          <div key={r.name} className={`grid items-center ${LABEL}`}>
            <div className="flex flex-col">
              <span className="font-sans text-[13px] font-semibold leading-tight sm:text-body">{r.name}</span>
              <span className="font-mono text-[10px] uppercase leading-tight text-mute">{r.meta}</span>
            </div>
            <div className="relative h-8 overflow-hidden rounded-md bg-[var(--line)]/50">
              {/* маркер старта потока — вертикаль на дне 8 (совпадает с левым
                  краем сборки и сдачи) */}
              <div className="absolute inset-y-0 left-[29%] w-px bg-ink/25" />
              <div
                style={{ left: `${r.left}%`, width: `${r.width}%` }}
                className={`absolute inset-y-0 flex items-center rounded-md px-2.5 ${BAR_TONE[r.tone]}`}
              >
                <span
                  className={`hidden min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.04em] sm:block ${
                    r.tone === "volt" ? "text-ink" : r.tone === "dark" ? "text-paper" : "text-ink/70"
                  }`}
                >
                  {r.desc}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* подпись параллели */}
      <div className={`mt-3 grid ${LABEL}`}>
        <span />
        <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.04em] text-[var(--acc)]">
          ↑ с&nbsp;8-го дня сборка и&nbsp;сдача идут вместе — поток не&nbsp;ждёт финала сборки
        </p>
      </div>
    </div>
  );
}
