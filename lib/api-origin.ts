// CSRF Origin check — единая функция для всех API routes.
// В prod разрешён боевой домен (воркер Cloudflare) плюс необязательный
// APP_ORIGIN из env. В dev — любой http://localhost:* (Next.js preview
// может рандомизировать порт).
//
// Когда подключишь собственный домен — добавь его сюда и в APP_ORIGIN.
//
// Использование:
//   if (!isAllowedOrigin(req.headers.get("origin"))) return 403;

const PROD_ORIGINS = [
  "https://voltarenda.small-pimp.workers.dev",
];
const DEV_LOCALHOST_RE = /^http:\/\/localhost:\d+$/;

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (process.env.APP_ORIGIN && origin === process.env.APP_ORIGIN) return true;
  if (PROD_ORIGINS.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && DEV_LOCALHOST_RE.test(origin);
}
