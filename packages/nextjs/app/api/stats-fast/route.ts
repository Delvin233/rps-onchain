import { NextRequest, NextResponse } from "next/server";
import { CACHE_PREFIXES, cacheManager } from "~~/lib/cache-manager";
import { calculateMixedStatistics, getStatisticsDisplayMode, validateMixedStatistics } from "~~/lib/mixedStatistics";
import { withRateLimit } from "~~/lib/rate-limiter";
import { type ResilientStats, resilientGetStats, resilientUpdateStats } from "~~/lib/resilient-database";

export async function GET(request: NextRequest) {
  return withRateLimit(request, "stats", async () => {
    try {
      const { searchParams } = new URL(request.url);
      const address = searchParams.get("address");

      if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
      }

      const addressLower = address.toLowerCase();

      // Get stats using resilient database operations
      // This includes circuit breaker, retry logic, and fallback to cache
      const dbStats = await resilientGetStats(addressLower);

      if (dbStats && typeof dbStats === "object") {
        // Type-safe property access using ResilientStats interface
        const stats = dbStats as ResilientStats;

        // Extract legacy statistics (round-based)
        const legacyStats = {
          ai_games: stats.ai_games || 0,
          ai_wins: stats.ai_wins || 0,
          ai_ties: stats.ai_ties || 0,
          multiplayer_games: stats.multiplayer_games || 0,
          multiplayer_wins: stats.multiplayer_wins || 0,
          multiplayer_ties: stats.multiplayer_ties || 0,
        };

        // Extract match statistics (best-of-three)
        const matchStats = {
          ai_matches_played: stats.ai_matches_played || 0,
          ai_matches_won: stats.ai_matches_won || 0,
          ai_matches_lost: stats.ai_matches_lost || 0,
          ai_matches_tied: stats.ai_matches_tied || 0,
          ai_matches_abandoned: stats.ai_matches_abandoned || 0,
        };

        // Calculate mixed statistics with backward compatibility
        const mixedStats = calculateMixedStatistics(legacyStats, matchStats);

        // Validate the calculated statistics
        const validation = validateMixedStatistics(mixedStats);
        if (!validation.isValid) {
          console.warn(`[Stats API] Statistics validation failed for ${addressLower}:`, validation.errors);
          // Log warnings but continue serving the stats
          if (validation.warnings.length > 0) {
            console.warn(`[Stats API] Statistics warnings for ${addressLower}:`, validation.warnings);
          }
        }

        // Get display mode for UI guidance
        const displayMode = getStatisticsDisplayMode(mixedStats);

        // Format response with mixed statistics and metadata
        const formattedStats = {
          ...mixedStats,
          // Add metadata for UI components
          _metadata: {
            displayMode: displayMode.mode,
            showLegacyBreakdown: displayMode.showLegacyBreakdown,
            showMatchBreakdown: displayMode.showMatchBreakdown,
            primaryStatistic: displayMode.primaryStatistic,
            hasLegacyGames: mixedStats.ai.legacy.totalGames > 0,
            hasMatches: mixedStats.ai.matches.totalMatches > 0,
            validationPassed: validation.isValid,
            validationWarnings: validation.warnings,
          },
        };

        return NextResponse.json({ stats: formattedStats });
      }

      // This should never happen with resilient operations, but just in case
      const emptyLegacyStats = {
        ai_games: 0,
        ai_wins: 0,
        ai_ties: 0,
        multiplayer_games: 0,
        multiplayer_wins: 0,
        multiplayer_ties: 0,
      };

      const emptyMatchStats = {
        ai_matches_played: 0,
        ai_matches_won: 0,
        ai_matches_lost: 0,
        ai_matches_tied: 0,
        ai_matches_abandoned: 0,
      };

      const emptyMixedStats = calculateMixedStatistics(emptyLegacyStats, emptyMatchStats);
      const emptyDisplayMode = getStatisticsDisplayMode(emptyMixedStats);

      const emptyStats = {
        ...emptyMixedStats,
        _metadata: {
          displayMode: emptyDisplayMode.mode,
          showLegacyBreakdown: emptyDisplayMode.showLegacyBreakdown,
          showMatchBreakdown: emptyDisplayMode.showMatchBreakdown,
          primaryStatistic: emptyDisplayMode.primaryStatistic,
          hasLegacyGames: false,
          hasMatches: false,
          validationPassed: true,
          validationWarnings: [],
        },
      };

      return NextResponse.json({ stats: emptyStats });
    } catch (error) {
      console.error("Error fetching stats:", error);

      // Return empty mixed statistics on error
      const errorLegacyStats = {
        ai_games: 0,
        ai_wins: 0,
        ai_ties: 0,
        multiplayer_games: 0,
        multiplayer_wins: 0,
        multiplayer_ties: 0,
      };

      const errorMatchStats = {
        ai_matches_played: 0,
        ai_matches_won: 0,
        ai_matches_lost: 0,
        ai_matches_tied: 0,
        ai_matches_abandoned: 0,
      };

      const errorMixedStats = calculateMixedStatistics(errorLegacyStats, errorMatchStats);
      const errorDisplayMode = getStatisticsDisplayMode(errorMixedStats);

      return NextResponse.json({
        stats: {
          ...errorMixedStats,
          _metadata: {
            displayMode: errorDisplayMode.mode,
            showLegacyBreakdown: errorDisplayMode.showLegacyBreakdown,
            showMatchBreakdown: errorDisplayMode.showMatchBreakdown,
            primaryStatistic: errorDisplayMode.primaryStatistic,
            hasLegacyGames: false,
            hasMatches: false,
            validationPassed: true,
            validationWarnings: [],
          },
        },
      });
    }
  });
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, "gameplay", async () => {
    try {
      const { address, result, isAI } = await request.json();

      if (!address || !result) {
        return NextResponse.json({ error: "Address and result required" }, { status: 400 });
      }

      const addressLower = address.toLowerCase();
      const isWin = result === "win";
      const isTie = result === "tie";

      // Update stats using resilient database operations
      // This includes circuit breaker, retry logic, and graceful failure handling
      const success = await resilientUpdateStats(addressLower, isWin, isTie, isAI);

      if (success) {
        // Also invalidate leaderboard cache if it's an AI win
        if (isAI && isWin) {
          try {
            await cacheManager.invalidatePattern("*", {
              prefix: CACHE_PREFIXES.LEADERBOARD,
            });
          } catch (error) {
            console.warn("[Stats API] Failed to invalidate leaderboard cache:", error);
            // Don't fail the request if cache invalidation fails
          }
        }
        return NextResponse.json({ success: true });
      } else {
        // Resilient operation failed gracefully
        console.warn(`[Stats API] Stats update failed gracefully for ${addressLower}`);
        return NextResponse.json(
          {
            success: false,
            message: "Stats update temporarily unavailable, but your game was recorded",
          },
          { status: 503 },
        );
      }
    } catch (error) {
      console.error("Error updating stats:", error);
      return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
    }
  });
}
