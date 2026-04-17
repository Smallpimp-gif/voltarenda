// Политика использования cookies.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Использование cookies",
  description:
    "Какие cookies мы используем на voltarenda.ru и зачем.",
};

export default function CookiesPage() {
  return (
    <>
      <div className="border-b border-[var(--line)] pb-6">
        <span className="font-mono text-caption uppercase text-mute">
          03 / COOKIES
        </span>
        <h1 className="mt-2 font-sans text-h2">Использование cookies</h1>
        <p className="mt-4 font-mono text-caption uppercase text-mute">
          РЕДАКЦИЯ ОТ 01.04.2026
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-12">
        <Section index="01" title="Что такое cookies">
          <p>
            Cookies — небольшие текстовые файлы, которые сайт сохраняет в
            браузере пользователя для хранения настроек, аналитики и улучшения
            работы сервиса.
          </p>
        </Section>

        <Section index="02" title="Какие cookies мы используем">
          <div className="flex flex-col">
            <Row
              k="ТЕХНИЧЕСКИЕ"
              v="СЕССИЯ, АВТОРИЗАЦИЯ"
              desc="Нужны для базовой работы сайта. Отключить нельзя."
            />
            <Row
              k="АНАЛИТИКА"
              v="ЯНДЕКС.МЕТРИКА, GOOGLE ANALYTICS"
              desc="Помогают понять как используется сайт. Обезличены."
            />
            <Row
              k="ФОРМЫ"
              v="LOCALSTORAGE"
              desc="Сохраняют прогресс заполнения заявки, чтобы не потерять данные."
            />
          </div>
        </Section>

        <Section index="03" title="Управление">
          <p>
            Ты можешь отключить cookies в настройках браузера — при этом часть
            функций сайта может работать некорректно (например, форма заявки
            не будет сохраняться между сессиями).
          </p>
        </Section>

        <Section index="04" title="Изменения">
          <p>
            Политика использования cookies может обновляться. Актуальная версия
            всегда доступна на этой странице. Последнее обновление указано в
            заголовке.
          </p>
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

function Row({ k, v, desc }: { k: string; v: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[var(--line)] py-4">
      <div className="flex items-baseline justify-between gap-4 font-mono text-caption uppercase">
        <span className="text-mute">{k}</span>
        <span className="tnum text-right text-[var(--text)]">{v}</span>
      </div>
      <p className="font-sans text-body text-mute">{desc}</p>
    </div>
  );
}
