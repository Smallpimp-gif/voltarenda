// Экспорт инвест-презентации /invest в PDF.
// Рендерит каждый из 6 слайдов в headless-Chrome и собирает в один PDF.
// Формат задаётся через OUT_W/OUT_H (px). По умолчанию — портрет 2000×3000.
// Запуск: node export-invest-pdf.mjs   (нужен запущенный `npm run dev`)
//   OUT_W=3000 OUT_H=2000 node export-invest-pdf.mjs   — другой формат

import puppeteer from "puppeteer";
import { writeFileSync, mkdirSync } from "node:fs";

const URL = process.env.DECK_URL || "http://localhost:3000/invest";
const OUT = "voltarenda-invest.pdf";

// Размер выходной страницы (px).
const OUT_W = Number(process.env.OUT_W || 2000);
const OUT_H = Number(process.env.OUT_H || 3000);
const SCALE = Number(process.env.SCALE || 2); // плотность рендера (чёткость)
const CSS_W = Math.round(OUT_W / SCALE); // ширина вьюпорта в CSS-px
const CSS_H = Math.round(OUT_H / SCALE);

const THEMES = ["dark", "light", "dark", "dark", "light", "dark", "dark"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
const page = await browser.newPage();
await page.setViewport({ width: CSS_W, height: CSS_H, deviceScaleFactor: SCALE });

console.log("→ open", URL, "· формат", OUT_W + "×" + OUT_H, "(css", CSS_W + "×" + CSS_H, "×" + SCALE + ")");
await page.goto(URL, { waitUntil: "networkidle0", timeout: 90000 });

// Прячем интерактивный хром колоды (точки-навигация + подсказки).
await page.addStyleTag({
  content: `
    nav[aria-label="Навигация по слайдам"],
    button[aria-label="Следующий слайд"],
    button[aria-label="В начало"] { display: none !important; }
  `,
});

try { await page.evaluateHandle("document.fonts.ready"); } catch {}
await sleep(3500);

// Проверяем, что слайд не выше страницы (иначе низ обрежется в PDF).
// Слайд — min-h-[100svh] с overflow-hidden: при переполнении секция РАСТЁТ
// выше вьюпорта, а PDF-страница фиксированной высоты CSS_H обрезает всё, что
// торчит ниже. Поэтому меряем реальную высоту секции против высоты страницы,
// а не внутренний scroll (тот всегда 0 — секция растёт вместе с контентом).
const overflow = await page.evaluate((cssH) => {
  const els = Array.from(document.querySelectorAll("[data-invest-slide]"));
  return els.map((el) => Math.max(0, Math.ceil(el.getBoundingClientRect().height - cssH)));
}, CSS_H);
console.log("→ overflow per slide, px (должно быть 0):", overflow);
if (overflow.some((v) => v > 0)) {
  console.log("  ⚠ ОБРЕЗКА: слайды выше страницы —", overflow.map((v, i) => v > 0 ? `#${i + 1}:+${v}px` : null).filter(Boolean).join(", "));
}

const shots = [];
for (let i = 0; i < THEMES.length; i++) {
  await page.evaluate(
    (idx, theme) => {
      const slides = document.querySelectorAll("[data-invest-slide]");
      slides[idx].scrollIntoView({ behavior: "instant", block: "start" });
      const shell = document.querySelector(".snap-y")?.parentElement;
      shell?.querySelectorAll("[data-theme]").forEach((el) => {
        if (!el.hasAttribute("data-invest-slide")) el.setAttribute("data-theme", theme);
      });
    },
    i,
    THEMES[i]
  );
  await sleep(700);
  const buf = await page.screenshot({ type: "png" });
  shots.push(Buffer.from(buf).toString("base64"));
  try { mkdirSync("pdf-preview", { recursive: true }); writeFileSync(`pdf-preview/slide-${i + 1}.png`, buf); } catch {}
  console.log("  ✓ slide", i + 1);
}

// Собираем картинки в PDF: страницы точного размера OUT_W×OUT_H.
const pagesHtml = shots
  .map((b64) => `<div class="pg"><img src="data:image/png;base64,${b64}"/></div>`)
  .join("");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: ${OUT_W}px ${OUT_H}px; margin: 0; }
  html,body { margin:0; padding:0; }
  .pg { width:${OUT_W}px; height:${OUT_H}px; overflow:hidden; page-break-after: always; break-after: page; }
  .pg:last-child { page-break-after: auto; break-after: auto; }
  img { width:${OUT_W}px; height:${OUT_H}px; display:block; }
</style></head><body>${pagesHtml}</body></html>`;

const pdfPage = await browser.newPage();
await pdfPage.setContent(html, { waitUntil: "networkidle0" });
await pdfPage.pdf({
  path: OUT,
  width: `${OUT_W}px`,
  height: `${OUT_H}px`,
  printBackground: true,
  pageRanges: "1-7",
});
await browser.close();
console.log("✓ saved", OUT, OUT_W + "×" + OUT_H);
