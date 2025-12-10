import { NextRequest, NextResponse } from "next/server";
import { redis } from "./upstash";

// Simple rate limiter using Redis directly
export class SimpleRateLimiter {
  private prefix: string;
  public limit: number;
  private windowMs: number;

  constructor(prefix: string, limit: number, windowMs: number) {
    this.prefix = prefix;
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const window = Math.floor(now / this.windowMs);
    const windowKey = `${key}:${window}`;

    try {
      // Get current count for this window
      const current = await redis.get(windowKey);
      const count = current ? parseInt(current as string) : 0;

      if (count >= this.limit) {
        return {
          success: false,
          remaining: 0,
          reset: (window + 1) * this.windowMs,
        };
      }

      // Increment counter
      const pipeline = redis.pipeline();
      pipeline.incr(windowKey);
      pipeline.expire(windowKey, Math.ceil(this.windowMs / 1000));
      await pipeline.exec();

      return {
        success: true,
        remaining: this.limit - count - 1,
        reset: (window + 1) * this.windowMs,
      };
    } catch (error) {
      console.error("Rate limiter error:", error);
      // If Redis fails, allow the request
      return {
        success: true,
        remaining: this.limit,
        reset: now + this.windowMs,
      };
    }
  }
}

// Rate limiters for different categories
export const rateLimiters = {
  stats: new SimpleRateLimiter("rl:stats", 60, 60000), // 60 requests per minute
  gameplay: new SimpleRateLimiter("rl:gameplay", 30, 60000), // 30 requests per minute
  rooms: new SimpleRateLimiter("rl:rooms", 10, 60000), // 10 requests per minute
  default: new SimpleRateLimiter("rl:default", 100, 60000), // 100 requests per minute
};

// Get client identifier
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "127.0.0.1";
  return ip;
}

// Rate limiting middleware
export async function withSimpleRateLimit(
  request: NextRequest,
  category: keyof typeof rateLimiters,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimiter = rateLimiters[category];

    const { success, remaining, reset } = await rateLimiter.check(identifier);

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
            "X-RateLimit-Limit": rateLimiter.limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    // Execute the handler and add rate limit headers
    const result = await handler();
    result.headers.set("X-RateLimit-Limit", rateLimiter.limit.toString());
    result.headers.set("X-RateLimit-Remaining", remaining.toString());
    result.headers.set("X-RateLimit-Reset", reset.toString());

    return result;
  } catch (error) {
    console.error(`[RateLimit] Error in rate limiting for category ${category}:`, error);
    // If rate limiting fails, allow the request to proceed
    return handler();
  }
}
