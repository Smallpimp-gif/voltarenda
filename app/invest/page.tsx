import type { Metadata } from "next";
import { InvestDeck } from "@/components/invest/invest-deck";

// Инвест-презентация — закрытый питч, из поиска прячем.
export const metadata: Metadata = {
  title: "Инвестиционное предложение · Вольтаренда",
  description:
    "Бренд электровелосипедов, который захватывает рынок доставки. 8 слайдов: рынок, клиенты, юнит-экономика, риски, стратегия, команда и условия захода.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/invest" },
};

export default function InvestPage() {
  return <InvestDeck />;
}
