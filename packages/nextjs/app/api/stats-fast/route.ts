import { NextRequest, NextResponse } from "next/server";
import { CACHE_PREFIXES, cacheManager } from "~~/lib/cache-manager";
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
        const totalGames = stats.totalGames || 0;
        const wins = stats.wins || 0;
        const losses = stats.losses || 0;
        const ties = stats.ties || 0;
        const aiGames = stats.ai_games || 0;
        const aiWins = stats.ai_wins || 0;
        const aiTies = stats.ai_ties || 0;
        const mpGames = stats.multiplayer_games || 0;
        const mpWins = stats.multiplayer_wins || 0;
        const mpTies = stats.multiplayer_ties || 0;

        // Match-level statistics
        const aiMatchesPlayed = stats.ai_matches_played || 0;
        const aiMatchesWon = stats.ai_matches_won || 0;
        const aiMatchesLost = stats.ai_matches_lost || 0;
        const aiMatchesTied = stats.ai_matches_tied || 0;
        const aiMatchesAbandoned = stats.ai_matches_abandoned || 0;

        const formattedStats = {
          totalGames,
          wins,
          losses,
          ties,
          winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
          ai: {
            totalGames: aiGames,
            wins: aiWins,
            losses: aiGames - aiWins - aiTies,
            ties: aiTies,
            winRate: aiGames > 0 ? Math.round((aiWins / aiGames) * 100) : 0,
            // Match-level statistics for AI games
            matches: {
              totalMatches: aiMatchesPlayed,
              wins: aiMatchesWon,
              losses: aiMatchesLost,
              ties: aiMatchesTied,
              abandoned: aiMatchesAbandoned,
              winRate: aiMatchesPlayed > 0 ? Math.round((aiMatchesWon / aiMatchesPlayed) * 100) : 0,
              completionRate:
                aiMatchesPlayed + aiMatchesAbandoned > 0
                  ? Math.round((aiMatchesPlayed / (aiMatchesPlayed + aiMatchesAbandoned)) * 100)
                  : 100,
            },
          },
          multiplayer: {
            totalGames: mpGames,
            wins: mpWins,
            losses: mpGames - mpWins - mpTies,
            ties: mpTies,
            winRate: mpGames > 0 ? Math.round((mpWins / mpGames) * 100) : 0,
          },
        };

        return NextResponse.json({ stats: formattedStats });
      }

      // This should never happen with resilient operations, but just in case
      const emptyStats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        winRate: 0,
        ai: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
          matches: {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            abandoned: 0,
            winRate: 0,
            completionRate: 100,
          },
        },
        multiplayer: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
      };

      return NextResponse.json({ stats: emptyStats });
    } catch (error) {
      console.error("Error fetching stats:", error);
      return NextResponse.json({
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
          ai: {
            totalGames: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            winRate: 0,
            matches: {
              totalMatches: 0,
              wins: 0,
              losses: 0,
              ties: 0,
              abandoned: 0,
              winRate: 0,
              completionRate: 100,
            },
          },
          multiplayer: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
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
