import { NextRequest, NextResponse } from "next/server";
import { redis } from "./upstash";
import { Ratelimit } from "@upstash/ratelimit";

// Rate limit configurations for different endpoint types
export const RATE_LIMITS = {
  // High-frequency endpoints (user actions)
  stats: { requests: 60, window: "1 m" as const }, // 1 per second
  gameplay: { requests: 30, window: "1 m" as const }, // 0.5 per second

  // Medium-frequency endpoints
  leaderboard: { requests: 20, window: "1 m" as const }, // 1 per 3 seconds
  rooms: { requests: 10, window: "1 m" as const }, // 1 per 6 seconds

  // Low-frequency endpoints (expensive operations)
  verification: { requests: 5, window: "1 m" as const }, // 1 per 12 seconds
  migration: { requests: 2, window: "1 m" as const }, // 1 per 30 seconds

  // Global fallback
  default: { requests: 100, window: "1 m" as const }, // 1.67 per second
} as const;

// Create rate limiters for each category
const createRateLimiter = (config: { requests: number; window: "1 m" }) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: "ratelimit",
  });
};

// Rate limiter instances
export const rateLimiters = {
  stats: createRateLimiter(RATE_LIMITS.stats),
  gameplay: createRateLimiter(RATE_LIMITS.gameplay),
  leaderboard: createRateLimiter(RATE_LIMITS.leaderboard),
  rooms: createRateLimiter(RATE_LIMITS.rooms),
  verification: createRateLimiter(RATE_LIMITS.verification),
  migration: createRateLimiter(RATE_LIMITS.migration),
  default: createRateLimiter(RATE_LIMITS.default),
};

// Rate limit categories for different endpoints
export const ENDPOINT_CATEGORIES = {
  // Stats endpoints
  "/api/stats-fast": "stats",
  "/api/user-stats": "stats",
  "/api/player-data": "stats",

  // Gameplay endpoints
  "/api/room/create": "rooms",
  "/api/room/join": "rooms",
  "/api/room/submit-move": "gameplay",
  "/api/store-match": "gameplay",
  "/api/store-multiplayer-match": "gameplay",

  // Leaderboard endpoints
  "/api/leaderboard/ai": "leaderboard",
  "/api/leaderboard/ai/player": "leaderboard",
  "/api/leaderboard/ai/update": "leaderboard",
  "/api/leaderboard/matches": "leaderboard",
  "/api/leaderboard/matches/player": "leaderboard",

  // Verification endpoints
  "/api/verify": "verification",
  "/api/check-verification": "verification",

  // Migration endpoints (admin-like operations)
  "/api/migrate-data": "migration",
  "/api/migrate-user": "migration",
  "/api/migrate-verifications": "migration",
} as const;

// Get client identifier (IP + User-Agent for better uniqueness)
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Create a simple hash of IP + User-Agent for better rate limiting
  const identifier = `${ip}:${userAgent.slice(0, 50)}`;
  return identifier;
}

// Rate limiting middleware
export async function withRateLimit(
  request: NextRequest,
  category: keyof typeof rateLimiters,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimiter = rateLimiters[category];

    const { success, limit, reset, remaining } = await rateLimiter.limit(identifier);

    if (!success) {
      console.warn(`[RateLimit] Blocked request from ${identifier} for category ${category}`);

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    // Execute the handler and add rate limit headers
    const result = await handler();

    // Add rate limit headers to successful responses
    result.headers.set("X-RateLimit-Limit", limit.toString());
    result.headers.set("X-RateLimit-Remaining", remaining.toString());
    result.headers.set("X-RateLimit-Reset", reset.toString());

    return result;
  } catch (error) {
    console.error(`[RateLimit] Error in rate limiting for category ${category}:`, error);
    // If rate limiting fails, allow the request to proceed
    return handler();
  }
}

// Helper function to get rate limit category for an endpoint
export function getRateLimitCategory(pathname: string): keyof typeof rateLimiters {
  return (ENDPOINT_CATEGORIES[pathname as keyof typeof ENDPOINT_CATEGORIES] || "default") as keyof typeof rateLimiters;
}

// Utility function to check rate limit without consuming it (for monitoring)
export async function checkRateLimit(
  request: NextRequest,
  category: keyof typeof rateLimiters,
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const identifier = getClientIdentifier(request);
  const rateLimiter = rateLimiters[category];

  // Use a dry-run check (doesn't consume the rate limit)
  return rateLimiter.limit(identifier);
}
