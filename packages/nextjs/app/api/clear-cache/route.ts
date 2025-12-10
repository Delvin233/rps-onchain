import { NextResponse } from "next/server";
import { cacheManager } from "~~/lib/cache-manager";

/**
 * Cache Clearing Utility Endpoint
 *
 * Clears corrupted or old cache entries to fix serialization issues
 *
 * POST /api/clear-cache
 */
export async function POST() {
  try {
    // Clear all stats cache entries
    await cacheManager.invalidatePattern("*", {
      prefix: "stats",
    });

    // Clear all leaderboard cache entries
    await cacheManager.invalidatePattern("*", {
      prefix: "leaderboard",
    });

    // Clear all match cache entries
    await cacheManager.invalidatePattern("*", {
      prefix: "match",
    });

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Clear Cache] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear cache",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
