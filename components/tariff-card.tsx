// Карточка тарифа — серверный компонент без внутренних анимаций.
// Reveal происходит на уровне обёртки (см. tariffs-section.tsx → <Reveal>),
// а сама карточка статична — так убран избыточный двойной stagger который
// делал появление секции "Выбери период" долгим и нудным.

type Spec = {
  label: string;
  value: string;
};

// Рендерит строку с подстановкой ₽ в font-sans span (обход отсутствия глифа в Geist Mono).
function renderValue(v: string) {
  const parts = v.split("₽");
  if (parts.length === 1) return v;
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && <span className="font-sans">₽</span>}
    </span>
  ));
}

type Props = {
  index: string; // "02" — нумерация как тех-маркировка
  name: string; // "Неделя"
  price: string; // "5 500"
  period: string; // "7 ДНЕЙ"
  specs: Spec[];
  accent?: boolean; // один тариф выделен как рекомендованный
  onApply?: () => void;
};

export function TariffCard({
  index,
  name,
  price,
  period,
  specs,
  accent = false,
  onApply,
}: Props) {
  return (
    <article
      className="
        tariff-card
        group relative flex flex-col overflow-hidden
        rounded-lg
        p-5 sm:p-8
      "
    >
      {/* Верхняя тех-маркировка */}
      <header className="flex items-center justify-between">
        <span className="font-mono text-caption uppercase text-mute">
          ТАРИФ / {index}
        </span>
        <span className="font-mono text-caption uppercase text-mute">
          ВОЛЬТ U2
        </span>
      </header>

      {/* Название тарифа */}
      <h3 className="mt-6 font-sans text-h2 sm:mt-16">{name}</h3>

      {/* Цена — mono + tabular-nums, огромная */}
      <div className="mt-3 flex flex-col">
        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-mono tnum text-[clamp(44px,5vw,68px)] leading-none tracking-tight">
            {price}
          </span>
          <span className="font-sans text-[clamp(24px,3vw,36px)] leading-none text-mute">
            ₽
          </span>
        </div>
        <span className="mt-3 font-mono text-caption uppercase text-mute">
          / {period}
        </span>
      </div>

      {/* Hairline-разделитель */}
      <div className="tariff-divider mt-5 h-px w-full bg-[var(--card-line)] sm:mt-10" />

      {/* Список характеристик — как в тех-паспорте */}
      <dl className="mt-6 flex flex-col gap-3">
        {specs.map((s) => (
          <div
            key={s.label}
            className="flex items-baseline justify-between gap-4 font-mono text-caption uppercase"
          >
            <dt className="text-mute">{s.label}</dt>
            <dd className="tnum text-right">{renderValue(s.value)}</dd>
          </div>
        ))}
      </dl>

      {/* CTA — на hover слегка поднимается, на press сжимается */}
      <button
        type="button"
        onClick={onApply}
        className={[
          "tariff-btn btn-cta group/cta",
          "mt-6 inline-flex items-center justify-between sm:mt-12",
          "rounded-md px-5 py-4",
          "font-mono text-caption uppercase",
          accent
            ? "btn-cta-volt bg-volt text-ink hover:bg-volt-hover"
            // Secondary — инверсия карточки, читается через --card-text / --card-bg,
            // автоматически переворачивается когда карточка идёт в hover.
            : "bg-[var(--card-text)] text-[var(--card-bg)]",
        ].join(" ")}
      >
        <span>Начать</span>
        <span
          aria-hidden
          className="font-sans text-base transition-transform duration-base ease-out-soft group-hover/cta:translate-x-1"
        >
          →
        </span>
      </button>
    </article>
  );
}
