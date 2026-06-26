import type { Metadata } from "next";
import { PriceSheet } from "@/components/price/price-sheet";

// Прайс-лист контрагента — внутренний документ, из поиска прячем.
// ?theme=dark|light — фирменный тёмный (по умолчанию) либо печатный светлый.
export const metadata: Metadata = {
  title: "Прайс-лист и условия · Вольтаренда",
  description:
    "Тарифы аренды и выкупа электровелосипедов Вольт, модели и стоимость, условия аренды, выкупа и заморозки.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/price" },
};

// A4-геометрия и печатные правила. Держим рядом с маршрутом — это про печать
// именно этого документа, не часть глобальной дизайн-системы.
const printCss = `
  @page { size: A4; margin: 0; }
  /* Ровно один лист A4: фикс-высота + overflow-hidden — подвал (mt-auto) прижат
     к низу и не утекает на 2-ю страницу из-за краевого округления. Контент сжат
     по вертикали так, чтобы всё (включая подвал) умещалось с запасом. */
  .sheet {
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    padding: 12mm 14mm 10mm;
  }
  /* Печатаем фоны и акценты как на экране (volt-плашки, тёмный фон). */
  .price-sheet,
  .price-sheet * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    html, body { margin: 0; background: transparent; }
    /* В печати убираем экранное центрирование — лист от левого верхнего угла. */
    .price-sheet { display: block; min-height: 0; }
    .sheet { margin: 0; }
  }
`;

export default async function PricePage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const { theme } = await searchParams;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
      <PriceSheet theme={theme === "light" ? "light" : "dark"} />
    </>
  );
}
