import { NextResponse } from "next/server";
import { getCacheStats } from "~~/lib/nameResolver";
import { turso } from "~~/lib/turso";

/**
 * Health check endpoint for AI Leaderboards
 *
 * Returns system health metrics including:
 * - Database connectivity
 * - Total players
 * - Cache statistics
 * - System status
 *
 * GET /api/leaderboard/ai/health
 */
export async function GET() {
  try {
    const startTime = Date.now();

    // Check database connectivity
    let dbHealthy = false;
    let totalPlayers = 0;
    let topRank = null;

    try {
      const countResult = await turso.execute("SELECT COUNT(*) as count FROM ai_leaderboards");
      totalPlayers = Number(countResult.rows[0].count);

      const topResult = await turso.execute("SELECT rank, wins FROM ai_leaderboards ORDER BY wins DESC LIMIT 1");
      if (topResult.rows.length > 0) {
        topRank = {
          rank: topResult.rows[0].rank as string,
          wins: Number(topResult.rows[0].wins),
        };
      }

      dbHealthy = true;
    } catch (error) {
      console.error("[Health Check] Database error:", error);
    }

    // Get cache statistics
    const cacheStats = getCacheStats();

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const health = {
      status: dbHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealthy,
        totalPlayers,
        topRank,
      },
      cache: {
        size: cacheStats.size,
        oldestEntryAge: cacheStats.oldestEntryAge,
      },
      performance: {
        responseTime: `${responseTime}ms`,
      },
    };

    return NextResponse.json(health);
  } catch (error) {
    console.error("[Health Check] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
