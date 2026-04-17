// Политика конфиденциальности — placeholder с типовой структурой.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Политика обработки персональных данных Вольтаренда — какие данные собираем, как храним, кому передаём.",
};

export default function PrivacyPage() {
  return (
    <>
      <div className="border-b border-[var(--line)] pb-6">
        <span className="font-mono text-caption uppercase text-mute">
          02 / ПОЛИТИКА
        </span>
        <h1 className="mt-2 font-sans text-h2">
          Политика конфиденциальности
        </h1>
        <p className="mt-4 font-mono text-caption uppercase text-mute">
          РЕДАКЦИЯ ОТ 01.04.2026 · В СООТВЕТСТВИИ С 152-ФЗ
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-12">
        <Section index="01" title="Оператор персональных данных">
          <p>
            Оператором персональных данных является физическое лицо{" "}
            <b>Семенов Евгений Ильич</b>, осуществляющий деятельность в
            Санкт‑Петербурге. Далее — «Оператор».
          </p>
        </Section>

        <Section index="02" title="Какие данные мы собираем">
          <p>
            При оформлении заявки на аренду Оператор обрабатывает: ФИО,
            паспортные данные (серия, номер, кем выдан, дата выдачи, дата
            рождения), фото разворотов паспорта и селфи с паспортом, контактные
            данные (телефон, email), данные банковской карты для списания
            арендной платы и залога (через защищённый шлюз CloudPayments без
            сохранения на нашей стороне).
          </p>
          <p>
            При использовании сайта Оператор собирает техническую информацию:
            IP-адрес, User-Agent, поведение на сайте (через Яндекс.Метрику),
            язык браузера, разрешение экрана.
          </p>
        </Section>

        <Section index="03" title="Цели обработки">
          <p>
            Персональные данные используются исключительно для: верификации
            личности Арендатора, оформления договора аренды, связи с
            Арендатором по вопросам заявки, обработки платежей, аналитики
            качества сервиса.
          </p>
        </Section>

        <Section index="04" title="Передача третьим лицам">
          <p>
            Оператор не передаёт персональные данные третьим лицам, за
            исключением случаев, предусмотренных законом, а также платёжных
            систем (CloudPayments) и сервисов аналитики (Яндекс, Google) в
            обезличенном виде.
          </p>
        </Section>

        <Section index="05" title="Хранение и защита">
          <p>
            Персональные данные хранятся на защищённых серверах в течение всего
            срока действия договора аренды и 3 (трёх) лет после его окончания.
            После этого данные удаляются безвозвратно.
          </p>
          <p>
            Оператор применяет организационные и технические меры для защиты
            данных от несанкционированного доступа: шифрование соединений
            (SSL/TLS), ограничение доступа сотрудников, регулярное резервное
            копирование.
          </p>
        </Section>

        <Section index="06" title="Права субъекта данных">
          <p>
            Арендатор имеет право: запросить доступ к своим данным, потребовать
            их уточнения или удаления, отозвать согласие на обработку,
            обратиться с жалобой в Роскомнадзор.
          </p>
          <p>
            Для реализации прав — отправь запрос на{" "}
            <a
              href="mailto:hi@voltarenda.ru"
              className="text-[var(--text)] underline underline-offset-4 transition-colors duration-quick ease-out-soft hover:text-volt"
            >
              hi@voltarenda.ru
            </a>{" "}
            с копией паспорта для верификации.
          </p>
        </Section>

        <Section index="07" title="Контакты">
          <dl className="flex flex-col gap-4 font-mono text-caption uppercase">
            <Row k="ОПЕРАТОР" v="СЕМЕНОВ ЕВГЕНИЙ ИЛЬИЧ" />
            <Row k="АДРЕС" v="Г. САНКТ-ПЕТЕРБУРГ" />
            <Row k="ТЕЛЕФОН" v="+7 (901) 300-03-19" />
            <Row k="EMAIL" v="HI@VOLTARENDA.RU" />
          </dl>
        </Section>
      </div>
    </>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-4 border-b border-[var(--line)] pb-3">
        <span className="font-mono text-caption uppercase text-mute">
          {index}
        </span>
        <h2 className="font-sans text-h3">{title}</h2>
      </div>
      <div className="flex flex-col gap-4 font-sans text-body leading-[1.6] text-mute">
        {children}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-2">
      <dt className="text-mute">{k}</dt>
      <dd className="tnum text-[var(--text)]">{v}</dd>
    </div>
  );
}
