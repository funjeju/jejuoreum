import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// ── Simple in-memory rate limiter ────────────────────────────────────────────
// Per-IP sliding window (best-effort; resets on cold start, not persistent).
// For persistent rate limiting in production, use Vercel KV + @upstash/ratelimit.
const rateMap = new Map<string, { count: number; reset: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMITS: Record<string, number> = {
  "/api/qr/match":            20,
  "/api/me/discoveries":      30,
  "/api/season-badges/check": 10,
  "/api/search":              60,
  "/api/":                   120, // default API limit
};

function getRateLimit(path: string): number {
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(prefix) && prefix !== "/api/") return limit;
  }
  return RATE_LIMITS["/api/"] ?? 120;
}

function isRateLimited(ip: string, path: string): boolean {
  const key = `${ip}:${path.split("/").slice(0, 4).join("/")}`;
  const limit = getRateLimit(path);
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > limit) return true;
  return false;
}

// Periodic cleanup to prevent memory leaks in long-running instances
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateMap.entries()) {
    if (now > entry.reset) rateMap.delete(key);
  }
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit API routes
  if (pathname.startsWith("/api/")) {
    maybeCleanup();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip, pathname)) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    return NextResponse.next();
  }

  // i18n routing for all other paths
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/api/(.*)",
    "/((?!_next|_vercel|.*\\..*).*)",
    "/",
  ],
};
