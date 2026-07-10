import type { Metadata } from "next";
import { OfferDeck } from "@/components/offer/offer-deck";

// Объединённое предложение — закрытая презентация, из поиска прячем.
export const metadata: Metadata = {
  title: "Предложение партнёру · Вольтаренда",
  description:
    "Два пути зайти в бренд, который захватывает рынок доставки: большой вход 10 млн или тест с 2 млн, доля 20%. Видение, рынок, роадмап и гибкие условия — всё обсуждаемо.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/offer" },
};

export default function OfferPage() {
  return <OfferDeck />;
}
