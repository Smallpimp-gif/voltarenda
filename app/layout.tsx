import type { Metadata } from "next";
import { generalSans, geistMono } from "./fonts";
import { ApplyProvider } from "@/components/apply";
import { YandexMetrika } from "@/components/yandex-metrika";
import "./globals.css";

const SITE_URL = "https://voltarenda.ru";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Вольтаренда — электровелосипеды для курьеров Санкт‑Петербурга",
    template: "%s · Вольтаренда",
  },
  description:
    "ВОЛЬТ U2 в аренду для курьеров Санкт‑Петербурга. От 633 ₽/день, выдача за 30 минут. Доход до 150 000 ₽/мес. Залог 5 000 ₽ возвратный.",
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
    title: "Вольтаренда — электровелосипеды для курьеров СПб",
    description:
      "ВОЛЬТ U2 в аренду. От 633 ₽/день. Доход до 150 000 ₽/мес. Выдача за 30 минут в СПб.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Вольтаренда — электровелосипеды для курьеров СПб",
    description:
      "ВОЛЬТ U2 в аренду. От 633 ₽/день. Доход до 150 000 ₽/мес. Выдача за 30 минут в СПб.",
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
    "Аренда электровелосипедов ВОЛЬТ U2 для курьеров Санкт‑Петербурга. От 633 ₽/день, доход до 150 000 ₽/мес.",
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
