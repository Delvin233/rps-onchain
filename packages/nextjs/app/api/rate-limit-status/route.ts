import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMITS, checkRateLimit } from "~~/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "default";

    // Validate category
    if (!RATE_LIMITS[category as keyof typeof RATE_LIMITS]) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Check rate limit status without consuming it
    const status = await checkRateLimit(request, category as keyof typeof RATE_LIMITS);

    return NextResponse.json({
      category,
      ...status,
      resetIn: Math.max(0, Math.ceil((status.reset - Date.now()) / 1000)),
      config: RATE_LIMITS[category as keyof typeof RATE_LIMITS],
    });
  } catch (error) {
    console.error("Error checking rate limit status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
