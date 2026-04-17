import type { Config } from "tailwindcss";

// Design tokens — направление A "Инженерный журнал"
// Источник истины для палитры, типографики, радиусов, моушна.
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Палитра — 7 цветов, один акцент
        ink: {
          DEFAULT: "#0A0A0A",     // основной тёмный фон
          2: "#141414",           // приподнятая поверхность
          3: "#1E1E1E",           // максимальная высота
        },
        paper: {
          DEFAULT: "#F2F1EC",     // тёплый off-white (не холодный #FFF)
          2: "#E6E4DD",           // приподнятая поверхность
        },
        mute: "var(--mute)",       // темозависимый: light #6B6860 (5.0:1), dark #9B9890 (7.3:1)
        volt: "#E5FF00",          // единственный акцент — неон с жёлтым подтоном
        "volt-hover": "#D6F000",  // hover-состояние volt (чуть темнее)
        danger: "#FF3D2E",        // ошибки, штрафы, просрочки
      },

      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        // --font-sans в mono-стеке как per-glyph fallback: браузер использует
        // его только для символов которых нет в Geist Mono (в частности ₽ U+20BD).
        mono: ["var(--font-mono)", "var(--font-sans)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      // Шкала — дисплейные размеры по clamp, сжимаются к мобайлу
      fontSize: {
        // Более плотные веса и tracking — как на icomat, ощутимо "ударнее"
        "display-1": ["clamp(44px, 6vw, 88px)", { lineHeight: "0.92", letterSpacing: "-0.04em",  fontWeight: "700" }],
        "display-2": ["clamp(32px, 4.5vw, 64px)", { lineHeight: "0.98", letterSpacing: "-0.035em", fontWeight: "700" }],
        "h2":        ["clamp(28px, 3.5vw, 44px)", { lineHeight: "1.02", letterSpacing: "-0.03em",  fontWeight: "600" }],
        "h3":        ["clamp(20px, 2.2vw, 28px)", { lineHeight: "1.12", letterSpacing: "-0.02em",  fontWeight: "600" }],
        "body-lg":   ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body":      ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "caption":   ["12px", { lineHeight: "16px", letterSpacing: "0.08em", fontWeight: "500" }],
      },

      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",  // основной радиус карточек (как в icomat)
        xl: "32px",
        pill: "9999px",
      },

      spacing: {
        // Агрессивно-компактно на мобиле (32px), десктоп до 128px
        "section-y": "clamp(32px, 8vw, 128px)",
        "gutter": "clamp(16px, 2vw, 24px)",
      },

      maxWidth: {
        content: "1280px",
      },

      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 0.61, 0.36, 1)",
        "in-out-soft": "cubic-bezier(0.65, 0, 0.35, 1)",
      },

      transitionDuration: {
        quick: "150ms",   // ховеры
        base: "320ms",    // переключения состояний
        slow: "640ms",    // scroll-reveal
      },
    },
  },
  plugins: [],
};

export default config;
