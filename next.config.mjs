/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [75, 85],
    // AVIF отдаём первым — поддерживается всеми современными браузерами
    // (Chrome 85+, Firefox 93+, Safari 16+). Fallback WebP для остальных.
    // На rider.webp (293 KB) ожидаемая экономия ~60% (≈110 KB AVIF).
    formats: ["image/avif", "image/webp"],
  },
  devIndicators: false,

  // Security headers — защита от XSS, clickjacking, MIME sniffing
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://widget.cloudpayments.ru https://mc.yandex.ru",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://mc.yandex.ru https://*.yandex.ru https://*.yandex.net",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.cloudpayments.ru https://mc.yandex.ru https://*.yandex.ru",
              "frame-src https://widget.cloudpayments.ru https://yandex.ru https://*.yandex.ru",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
