// Шрифтовая пара под стиль ICOMAT (icomat.co.uk).
// Оригинал icomat использует коммерческие Lay Grotesk Semibold + Akkurat Mono —
// бесплатных лицензий нет, поэтому подложены ближайшие свободные эквиваленты
// с полной поддержкой кириллицы (сайт русскоязычный):
//
//   sans  →  Onest          (близок к Lay Grotesk: модерновый гротеск,
//                            нейтральные пропорции, большие counter-формы)
//   mono  →  JetBrains Mono (близок к Akkurat Mono: гуманистический моно,
//                            ровный ритм, спокойные засечки)
//
// Имена экспортов и CSS-переменные --font-sans / --font-mono НЕ меняются —
// tailwind.config.ts и globals.css продолжают работать без правок.

import { Onest, JetBrains_Mono } from "next/font/google";

// Экспорт назван `generalSans` для обратной совместимости с layout.tsx —
// фактически это Onest. При рефакторинге переименовать в `onest`.
export const generalSans = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const geistMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});
