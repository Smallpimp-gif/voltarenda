"use client";

// Global error boundary — срабатывает если упал root layout (напр. ошибка
// в app/layout.tsx при рендере). В этом случае Next.js не может показать
// обычный app/error.tsx т.к. сам layout недоступен. global-error.tsx
// обязан сам рендерить <html> и <body>.
//
// Здесь нет доступа к шрифтам / CSS-переменным из layout.tsx — верстаем
// inline-стилями. Задача минимум: не показать пустой экран, дать путь
// обратно.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Global layout error:", error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#f4f3f1",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#8a8a8a",
              marginBottom: 24,
            }}
          >
            Вольтаренда · Error / 500
          </div>
          <h1
            style={{
              fontSize: 40,
              lineHeight: 1.05,
              margin: "0 0 16px",
              fontWeight: 700,
            }}
          >
            Сайт временно недоступен.
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.4,
              color: "#b8b8b8",
              margin: "0 0 32px",
            }}
          >
            Мы уже чиним. Попробуй обновить страницу через минуту или напиши в
            WhatsApp:{" "}
            <a
              href="https://wa.me/79013000319"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#E5FF00" }}
            >
              wa.me/79013000319
            </a>
            .
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-block",
              background: "#E5FF00",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 6,
              padding: "14px 24px",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Перезагрузить →
          </button>
          {error.digest && (
            <div
              style={{
                marginTop: 32,
                fontSize: 11,
                color: "#6a6a6a",
                fontFamily: "monospace",
              }}
            >
              REF: {error.digest}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
