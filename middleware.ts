// Rate limiting middleware — защита API routes от abuse.
// In-memory store (сбрасывается при рестарте сервера).
// Для production с несколькими инстансами — заменить на Redis.

import { NextResponse, type NextRequest } from "next/server";

// Rate limit config: max requests per window
const RATE_LIMIT = {
  windowMs: 60_000, // 1 минута
  maxRequests: 10, // макс 10 запросов к API за минуту с одного IP
};

// In-memory store: IP → { count, resetAt }
const store = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}, 300_000);

function getRateLimitResult(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMIT.maxRequests - entry.count };
}

export function middleware(request: NextRequest) {
  // Rate limit только API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { allowed, remaining } = getRateLimitResult(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Слишком много запросов. Подожди минуту." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
