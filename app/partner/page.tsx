import type { Metadata } from "next";
import { PartnerDeck } from "@/components/partner/partner-deck";

// Роудмап партнёра — закрытая презентация первого шага, из поиска прячем.
export const metadata: Metadata = {
  title: "Роудмап партнёра · Вольтаренда",
  description:
    "Из 2 000 000 ₽ — работающий бизнес за 3 недели. 15 велосипедов, своё помещение-мастерская, запуск и экономика: продажа, аренда под выкуп, распределение прибыли.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/partner" },
};

export default function PartnerPage() {
  return <PartnerDeck />;
}
