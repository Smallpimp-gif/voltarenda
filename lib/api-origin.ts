// CSRF Origin check — единая функция для всех API routes.
// В prod разрешён только https://voltarenda.ru. В dev — любой
// http://localhost:* (Next.js preview может рандомизировать порт).
//
// Использование:
//   if (!isAllowedOrigin(req.headers.get("origin"))) return 403;

const PROD_ORIGIN = "https://voltarenda.ru";
const DEV_LOCALHOST_RE = /^http:\/\/localhost:\d+$/;

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === PROD_ORIGIN) return true;
  return process.env.NODE_ENV !== "production" && DEV_LOCALHOST_RE.test(origin);
}
