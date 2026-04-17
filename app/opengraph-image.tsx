// Dynamic OG image для шаринга в соцсети / мессенджеры.
// Next 15 App Router рендерит из tsx → png через @vercel/og.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Вольтаренда — электровелосипеды для курьеров СПб";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "sans-serif",
          color: "#F2F1EC",
        }}
      >
        {/* Top eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "20px",
            letterSpacing: "0.12em",
            color: "#9B9890",
            textTransform: "uppercase",
          }}
        >
          <span>00 / ВОЛЬТАРЕНДА / СПБ</span>
        </div>

        {/* Big title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "128px",
              lineHeight: "0.9",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "#F2F1EC",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Бери</span>
            <span>и зарабатывай</span>
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#9B9890",
              maxWidth: "900px",
            }}
          >
            Электровелосипед ВОЛЬТ U2 в аренду курьерам Санкт‑Петербурга
          </div>
        </div>

        {/* Bottom bar: metrics + volt badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "64px",
              fontSize: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#9B9890",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span>доход / мес</span>
              <span style={{ color: "#F2F1EC", fontSize: "32px", fontWeight: 600 }}>
                150 000 ₽
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span>аренда от</span>
              <span style={{ color: "#F2F1EC", fontSize: "32px", fontWeight: 600 }}>
                633 ₽ / день
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span>выдача</span>
              <span style={{ color: "#F2F1EC", fontSize: "32px", fontWeight: 600 }}>
                30 минут
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px 24px",
              background: "#E5FF00",
              color: "#000000",
              fontSize: "22px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <span>Начать →</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
