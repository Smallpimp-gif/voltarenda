// Экспорт прайс-листа /price в PDF.
// В отличие от инвест-колоды (скриншоты — там framer-анимации), прайс — это
// текстовый документ: рендерим вектором через page.pdf() → текст выделяемый,
// файл лёгкий, чёткий A4. Снимаем обе темы: фирменную тёмную и печатную светлую.
// Запуск: node export-price-pdf.mjs  (нужен запущенный `npm run dev`)

import puppeteer from "puppeteer";

const BASE = process.env.PRICE_URL || "http://localhost:3000/price";
const OUTS = [
  { theme: "dark", path: "voltarenda-price.pdf" },        // фирменный — основной
  { theme: "light", path: "voltarenda-price-light.pdf" }, // печатный светлый
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});

for (const { theme, path } of OUTS) {
  const page = await browser.newPage();
  const url = `${BASE}?theme=${theme}`;
  console.log("→ open", url);
  await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  // Дожидаемся шрифтов (Onest + JetBrains Mono) и логотипа.
  try {
    await page.evaluateHandle("document.fonts.ready");
  } catch {}
  await sleep(400);
  await page.pdf({
    path,
    printBackground: true,
    preferCSSPageSize: true, // берём @page { size: A4 } из print-стилей
    format: "A4",
  });
  await page.close();
  console.log("  ✓ saved", path, `(${theme})`);
}

await browser.close();
console.log("✓ done");
