import type { Metadata } from "next";
import { generalSans, geistMono } from "./fonts";
import { ApplyProvider } from "@/components/apply";
import { YandexMetrika } from "@/components/yandex-metrika";
import "./globals.css";

const SITE_URL = "https://voltarenda.ru";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Электровелосипед Вольт U2 в аренду в СПб — от 633 ₽/день · Вольтаренда",
    template: "%s · Вольтаренда",
  },
  description:
    "Аренда электровелосипеда U2 для курьеров в Санкт‑Петербурге. 65 км/ч, 2 АКБ LiFePO4, до 120 км на смену. Выдача сегодня. Цены ниже рынка.",
  keywords: [
    "аренда электровелосипеда",
    "электровелосипед для курьера",
    "прокат велосипеда СПб",
    "ВОЛЬТ U2",
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
    title: "Электровелосипед Вольт U2 в аренду в СПб — от 633 ₽/день",
    description:
      "Топовая модель для курьеров: 65 км/ч, 2 АКБ LiFePO4, до 120 км на смену. Выдача сегодня, цены ниже рынка СПб.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Электровелосипед Вольт U2 в аренду в СПб — от 633 ₽/день",
    description:
      "Топовая модель для курьеров: 65 км/ч, 2 АКБ LiFePO4, до 120 км на смену. Выдача сегодня, цены ниже рынка СПб.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#organization`,
  name: "Вольтаренда",
  url: SITE_URL,
  description:
    "Аренда электровелосипедов ВОЛЬТ U2 для курьеров Санкт‑Петербурга. От 633 ₽/день, два АКБ 60+30 Ач, ~120 км на смену.",
  telephone: "+7 (901) 300-03-19",
  priceRange: "3500–19000 ₽",
  image: `${SITE_URL}/rider.webp`,
  logo: `${SITE_URL}/logo.svg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Шишкина, 297",
    addressLocality: "Парголово, Санкт‑Петербург",
    addressRegion: "Санкт‑Петербург",
    postalCode: "194356",
    addressCountry: "RU",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 60.081695,
    longitude: 30.311619,
  },
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
    >
      <head>
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
