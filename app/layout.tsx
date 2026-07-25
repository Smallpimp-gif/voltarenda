import type { Metadata, Viewport } from "next";
import { generalSans, geistMono } from "./fonts";
import { ApplyProvider } from "@/components/apply";
import { YandexMetrika } from "@/components/yandex-metrika";
import "./globals.css";

// Рабочий домен. Заменишь на собственный, когда привяжешь его к воркеру.
const SITE_URL = "https://voltarenda.small-pimp.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Электровелосипед Mingto U2 Pro в аренду в СПб — от 5 500 ₽/нед · Вольтаренда",
    template: "%s · Вольтаренда",
  },
  description:
    "Аренда и выкуп электровелосипеда Mingto U2 Pro для курьеров Санкт‑Петербурга. Мотор 2000 Вт, два аккумулятора, до 140 км на смену. Выдача сегодня, цены ниже рынка.",
  keywords: [
    "аренда электровелосипеда",
    "электровелосипед для курьера",
    "прокат велосипеда СПб",
    "Mingto U2 Pro",
    "велосипед для доставки",
    "Яндекс Еда",
    "Самокат",
    "Купер",
    "курьер СПб",
    "аренда велосипеда курьеру",
  ],
  authors: [{ name: "Вольтаренда" }],
  creator: "Вольтаренда",
  publisher: "Вольтаренда",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Вольтаренда",
    title: "Электровелосипед Mingto U2 Pro в аренду в СПб — от 5 500 ₽/нед",
    description:
      "Мощная модель для курьеров: мотор 2000 Вт, два аккумулятора, до 140 км на смену. Выдача сегодня, цены ниже рынка СПб.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Электровелосипед Mingto U2 Pro в аренду в СПб — от 5 500 ₽/нед",
    description:
      "Мощная модель для курьеров: мотор 2000 Вт, два аккумулятора, до 140 км на смену. Выдача сегодня, цены ниже рынка СПб.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "transportation",
};

// viewport-fit=cover включает env(safe-area-inset-*) — нужно, чтобы вёрстка
// (особенно нижний бар кабинета) корректно ложилась под notch/home-индикатор
// на iPhone и вырезы/жест-навигацию на Android.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F2F1EC",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#organization`,
  name: "Вольтаренда",
  url: SITE_URL,
  description:
    "Аренда и выкуп электровелосипедов Mingto U2 Pro для курьеров Санкт‑Петербурга. От 5 500 ₽/нед, два аккумулятора, до 140 км на смену.",
  telephone: "+7 (901) 300-03-19",
  priceRange: "5500–9630 ₽/нед",
  image: `${SITE_URL}/rider.webp`,
  logo: `${SITE_URL}/logo.svg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Черняховского, 24",
    addressLocality: "Санкт‑Петербург",
    addressRegion: "Санкт‑Петербург",
    addressCountry: "RU",
  },
  // geo намеренно не задан: координаты Черняховского, 24 не подтверждены.
  // Впиши точные lat/lng из Яндекс.Карт — иначе поиск уведёт людей не туда.
  areaServed: {
    "@type": "City",
    name: "Санкт‑Петербург",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "09:00",
    closes: "21:00",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${generalSans.variable} ${geistMono.variable}`}
      // Telegram WebApp SDK (telegram-web-app.js в <head>) выставляет на <html>
      // инлайн-стиль --tg-viewport-height ДО гидрации — React видит атрибут,
      // которого нет в его дереве, и ругается mismatch'ем. Стандартный приём
      // для стороннего скрипта, мутирующего <html>: гасим предупреждение здесь.
      suppressHydrationWarning
    >
      <head>
        {/* Telegram Mini App SDK — грузим РАНО, прямо в head, и сразу зовём
            ready()/expand(). Иначе на медленном LTE Telegram держит скелетон
            (приложение «не открывается»), пока ready() не вызван. */}
        <link rel="preconnect" href="https://telegram.org" />
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var w=window.Telegram&&window.Telegram.WebApp;if(w){w.ready();w.expand();}}catch(e){}",
          }}
        />

        {/* Preconnect — ускоряет загрузку сторонних скриптов */}
        <link rel="preconnect" href="https://mc.yandex.ru" />

        {/* CloudPayments — lazy-загружается при открытии шага оплаты
            (см. apply.tsx loadCloudPayments). Preconnect оставляем для скорости. */}
        <link rel="preconnect" href="https://widget.cloudpayments.ru" />

        {/* Яндекс.Метрика — загружается через клиентский компонент
            ТОЛЬКО после cookie consent (152-ФЗ). См. components/yandex-metrika.tsx */}
      </head>
      <body>
        {/* Skip-навигация — WCAG 2.4.1, видна только при фокусе клавиатурой */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-volt focus:px-4 focus:py-2 focus:font-mono focus:text-caption focus:uppercase focus:text-ink"
        >
          Перейти к содержимому
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <YandexMetrika />
        <ApplyProvider>{children}</ApplyProvider>
      </body>
    </html>
  );
}
