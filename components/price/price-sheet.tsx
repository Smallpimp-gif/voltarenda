// Прайс-лист «Вольтаренда» — печатный A4-документ для контрагента.
// Полностью наследует дизайн-систему сайта («Инженерный журнал»):
// палитра ink / paper / volt, шрифты Onest + JetBrains Mono, моно-капс
// тех-маркировка с volt-точкой, крупные tnum-цифры, hairline-разделители,
// rounded-lg карточки. danger (#FF3D2E) — штрафы и просрочки (тот же токен,
// что на сайте). Серверный компонент: статичный рендер без анимаций — ровно
// то, что нужно для вектора page.pdf() (текст остаётся выделяемым).
//
// Рендерится на маршруте /price и снимается в PDF через export-price-pdf.mjs.

import type { CSSProperties, ReactNode } from "react";

// ₽ внутри моно-стека добирается из --font-sans (у JetBrains Mono нет глифа
// рубля) — та же конвенция, что в tailwind.config.ts (mono: [...sans...]).

// ── Тех-маркировка секции: «01 / ТАРИФЫ» — моно-капс, volt-точка, mute. ──
function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
      <span aria-hidden className="inline-block h-1.5 w-1.5 shrink-0 bg-volt" />
      <span className="text-[var(--text)]">{index}</span>
      <span>{children}</span>
    </div>
  );
}

// ── Пункт условий: volt-квадрат + текст. Сумма-штраф подсвечивается danger. ──
function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 py-1">
      <span
        aria-hidden
        className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 bg-volt"
      />
      <span className="text-[11px] leading-[1.5] text-[var(--text)]">
        {children}
      </span>
    </li>
  );
}

// Штраф / просрочка — danger-акцент (токен «ошибки, штрафы, просрочки»).
function Pen({ children }: { children: ReactNode }) {
  // Цвет — через --pen (см. PriceSheet): на тёмном фирменный danger #FF3D2E,
  // на светлом глубже (#C41E0A, ~5.4:1) — иначе оранжево-красный «тонет».
  return <b className="font-semibold text-[var(--pen)]">{children}</b>;
}

// ── Сводная карточка тарифа: моно-капс шапка, крупная tnum-цифра, подпись. ──
function TariffCard({
  label,
  value,
  tail,
  caption,
  accent = false,
  theme = "dark",
}: {
  label: string;
  value: string;
  tail?: ReactNode;
  caption: string;
  accent?: boolean;
  theme?: "dark" | "light";
}) {
  // volt-цифра читается только на тёмном; на светлом volt-текст «тонет» —
  // акцент держат рамка и подсветка строки, число делаем жирным ink.
  const valueClass =
    accent && theme === "dark" ? "text-volt" : "text-[var(--text)]";
  return (
    <div
      className={`flex flex-col rounded-lg border bg-[var(--bg-2)] p-4 [break-inside:avoid] ${
        accent ? "border-volt/40" : "border-[var(--line)]"
      }`}
    >
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
        {accent && (
          <span aria-hidden className="inline-block h-1.5 w-1.5 bg-volt" />
        )}
        {label}
      </div>
      <div className="mt-5 flex items-baseline gap-1.5 whitespace-nowrap">
        <span
          className={`tnum text-[34px] font-semibold leading-[0.9] tracking-[-0.02em] ${valueClass}`}
        >
          {value}
        </span>
        {tail && (
          <span className="text-[15px] leading-none text-mute">{tail}</span>
        )}
      </div>
      <div className="mt-2.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-mute">
        {caption}
      </div>
    </div>
  );
}

// Строка таблицы моделей. flagship → volt-подсветка строки и итога.
type ModelRow = {
  model: string;
  battery: string;
  rent: string;
  buyout: string;
  weeks: string; // срок выкупа ≈ total ÷ 5 500 ₽/нед (последний платёж — остаток)
  total: string;
  flagship?: boolean;
};

const MODELS: ModelRow[] = [
  { model: "U2 простой", battery: "1 АКБ · 60 + 60 Ач", rent: "6 000", buyout: "5 500", weeks: "≈40", total: "218 500" },
  { model: "U2 простой", battery: "2 АКБ · 60 + 30 Ач", rent: "6 000", buyout: "5 500", weeks: "≈41", total: "225 500" },
  { model: "U2 Pro", battery: "2 АКБ · 60 + 30 Ач", rent: "6 500", buyout: "5 500", weeks: "≈41", total: "227 500" },
  { model: "U2 Pro", battery: "1 АКБ · 60 + 60 Ач", rent: "6 500", buyout: "5 500", weeks: "≈40", total: "220 500" },
  { model: "U7", battery: "1 АКБ · 60 + 60 Ач", rent: "7 000", buyout: "5 500", weeks: "≈49", total: "267 500", flagship: true },
];

export function PriceSheet({ theme = "dark" }: { theme?: "dark" | "light" }) {
  // volt-акцент итога флагмана читается только на тёмном; на светлом — жирный ink
  // (акцент строки держит volt-подсветка фона).
  const flagTotalClass = theme === "dark" ? "text-volt" : "text-[var(--text)]";
  // Штрафы/просрочки: яркий danger на тёмном, затемнённый на светлом (контраст AA).
  const penColor = theme === "dark" ? "#FF3D2E" : "#C41E0A";
  return (
    <div
      data-theme={theme}
      style={{ ["--pen"]: penColor } as CSSProperties}
      className="price-sheet flex min-h-screen justify-center bg-[var(--bg)] text-[var(--text)]"
    >
      <article className="sheet flex flex-col bg-[var(--bg)]">
        {/* ─────────────── Шапка-колонтитул ─────────────── */}
        <header>
          <div className="flex items-start justify-between gap-6">
            <img
              src="/logo.svg"
              alt="Вольтаренда"
              width={732}
              height={70}
              className="h-[22px] w-auto"
              style={{ filter: theme === "dark" ? "none" : "brightness(0)" }}
            />
            <div className="text-right font-mono text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-mute">
              <div className="text-[var(--text)]">Прайс-лист</div>
              <div className="tnum">Действует с 06 · 2026</div>
            </div>
          </div>
          <p className="mt-3.5 max-w-[62ch] text-[12px] leading-[1.45] text-mute">
            Прайс-лист и условия аренды&nbsp;· памятка для обработки лидов
            (курьеры Самоката).
          </p>
          <div className="mt-4 h-px w-full bg-[var(--line-strong)]" />
        </header>

        {/* ─────────────── 01 / Тарифы ─────────────── */}
        <section className="mt-5">
          <Eyebrow index="01">Тарифы</Eyebrow>
          <div className="mt-3.5 grid grid-cols-3 gap-3">
            <TariffCard
              label="Аренда"
              value="6 000"
              tail={
                <>
                  –7 000&nbsp;<span className="font-sans">₽</span>
                </>
              }
              caption="в неделю · зависит от модели"
              theme={theme}
            />
            <TariffCard
              label="Выкуп"
              value="5 500"
              tail={<span className="font-sans">₽</span>}
              caption="в неделю · до полной выплаты"
              accent
              theme={theme}
            />
            <TariffCard
              label="Залог"
              value="5 000"
              tail={<span className="font-sans">₽</span>}
              caption="возврат при исправной сдаче"
              theme={theme}
            />
          </div>
        </section>

        {/* ─────────────── 02 / Модели и стоимость ─────────────── */}
        <section className="mt-5">
          <Eyebrow index="02">Модели и стоимость</Eyebrow>
          <table className="mt-3.5 w-full border-collapse text-left [break-inside:avoid]">
            <thead>
              <tr className="border-b border-[var(--line-strong)] font-mono text-[9px] uppercase tracking-[0.08em] text-mute">
                <th className="py-2 font-medium">Модель</th>
                <th className="py-2 font-medium">Аккумуляторы</th>
                <th className="py-2 text-right font-medium">Аренда&nbsp;₽/нед</th>
                <th className="py-2 text-right font-medium">Выкуп&nbsp;₽/нед</th>
                <th className="py-2 text-right font-medium">Срок,&nbsp;нед</th>
                <th className="py-2 text-right font-medium">Выкуп&nbsp;— общая</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m, i) => (
                <tr
                  key={i}
                  className={`border-b border-[var(--line)] last:border-0 ${
                    m.flagship ? "bg-volt/[0.07]" : ""
                  }`}
                >
                  <td className="py-2 pr-3 text-[13px] font-semibold text-[var(--text)]">
                    {m.model}
                  </td>
                  <td className="py-2 pr-3 text-[11px] text-mute">
                    {m.battery}
                  </td>
                  <td className="tnum py-2 text-right text-[13px]">{m.rent}</td>
                  <td className="tnum py-2 text-right text-[13px]">{m.buyout}</td>
                  <td className="tnum py-2 text-right text-[13px] text-mute">{m.weeks}</td>
                  <td
                    className={`tnum py-2 text-right text-[13px] font-semibold ${
                      m.flagship ? flagTotalClass : "text-[var(--text)]"
                    }`}
                  >
                    {m.total}&nbsp;<span className="font-sans">₽</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-mute">
            Срок выкупа&nbsp;≈ общая&nbsp;÷&nbsp;5&nbsp;500&nbsp;₽/нед&nbsp;· последний
            платёж&nbsp;— остаток
          </p>
        </section>

        {/* ─────────────── 03–05 / Условия (две колонки) ─────────────── */}
        <section className="mt-5 grid grid-cols-2 gap-x-9">
          {/* Левая колонка — аренда */}
          <div className="[break-inside:avoid]">
            <Eyebrow index="03">Условия аренды</Eyebrow>
            <ul className="mt-2.5">
              <Item>
                Залог&nbsp;— <b className="font-semibold">5 000&nbsp;₽</b>,
                возвращается при сдаче велосипеда в&nbsp;исправном состоянии.
              </Item>
              <Item>
                Минимальный срок&nbsp;— 1&nbsp;неделя. Оплата авансом до&nbsp;17:00
                первого дня периода.
              </Item>
              <Item>Просрочка оплаты&nbsp;— велосипед изымается.</Item>
              <Item>
                Просрочка возврата&nbsp;— <Pen>2 000&nbsp;₽</Pen> за&nbsp;каждый
                день.
              </Item>
              <Item>
                Сервисный выезд при невозврате&nbsp;— <Pen>2 500&nbsp;₽</Pen>.
              </Item>
              <Item>
                Хранение&nbsp;— в&nbsp;помещении либо пристёгнутым и&nbsp;под
                чехлом. Иначе ущерб возмещается на&nbsp;<Pen>100%</Pen>{" "}
                за&nbsp;счёт арендатора.
              </Item>
              <Item>
                Запрещены субаренда, передача третьим лицам и&nbsp;вывоз
                за&nbsp;пределы СПб и&nbsp;ЛО без согласия. Нарушение&nbsp;— штраф{" "}
                <Pen>30 000&nbsp;₽</Pen>.
              </Item>
              <Item>
                Наклейки аренды защищают велосипед&nbsp;— с&nbsp;ними
                злоумышленники реже его трогают. Срывать до&nbsp;конца выкупа
                нельзя&nbsp;— штраф <Pen>3 000&nbsp;₽</Pen>.
              </Item>
              <Item>
                Ущерб по&nbsp;вине арендатора&nbsp;— за&nbsp;его счёт; заводской
                брак&nbsp;— по&nbsp;гарантии.
              </Item>
              <Item>
                Управление в&nbsp;состоянии опьянения&nbsp;— ущерб{" "}
                <Pen>100%</Pen> за&nbsp;счёт арендатора.
              </Item>
              <Item>
                География эксплуатации&nbsp;— Санкт-Петербург
                и&nbsp;Ленинградская область.
              </Item>
            </ul>
          </div>

          {/* Правая колонка — выкуп + заморозка */}
          <div>
            <div className="[break-inside:avoid]">
              <Eyebrow index="04">Условия выкупа</Eyebrow>
              <ul className="mt-2.5">
                <Item>
                  Платёж <b className="font-semibold">5 500&nbsp;₽/неделя</b>{" "}
                  до&nbsp;полной выплаты стоимости&nbsp;— далее велосипед
                  переходит в&nbsp;собственность арендатора.
                </Item>
                <Item>
                  <Pen>2 просрочки подряд</Pen>&nbsp;— велосипед изымается, ранее
                  выплаченные деньги не&nbsp;возвращаются.
                </Item>
              </ul>
            </div>

            <div className="mt-6 [break-inside:avoid]">
              <Eyebrow index="05">Заморозка на время отпуска</Eyebrow>
              <ul className="mt-2.5">
                <Item>
                  Стоимость&nbsp;— <b className="font-semibold">11 000&nbsp;₽</b>{" "}
                  за&nbsp;месяц (за полный месяц, без пересчёта по&nbsp;дням).
                </Item>
                <Item>Срок заморозки&nbsp;— от&nbsp;1 до&nbsp;3 месяцев.</Item>
                <Item>
                  На&nbsp;время заморозки велосипед сдаётся на&nbsp;парковку
                  компании.
                </Item>
                <Item>
                  Для тарифа выкупа: месяцы заморозки не&nbsp;засчитываются
                  в&nbsp;выкуп и&nbsp;оплачиваются отдельно.
                </Item>
              </ul>
            </div>
          </div>
        </section>

        {/* ─────────────── Подвал ─────────────── */}
        <footer className="mt-auto pt-4">
          <div className="h-px w-full bg-[var(--line)]" />
          <div className="mt-3.5 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.1em] text-mute">
            <span>
              Вольтаренда&nbsp;· внутренний документ для контрагента&nbsp;· цены
              в&nbsp;рублях
            </span>
            <span className="shrink-0 text-[var(--text)]">СПб&nbsp;· ЛО</span>
          </div>
        </footer>
      </article>
    </div>
  );
}
