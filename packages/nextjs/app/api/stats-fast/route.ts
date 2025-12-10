import { NextRequest, NextResponse } from "next/server";
import { CACHE_DURATIONS, CACHE_PREFIXES, cacheManager } from "~~/lib/cache-manager";
import { getStats, updateStats } from "~~/lib/tursoStorage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Try to get from cache first
    const cacheKey = `${addressLower}`;
    const cachedStats = await cacheManager.get(cacheKey, {
      prefix: CACHE_PREFIXES.STATS,
      ttl: CACHE_DURATIONS.STATS,
    });

    if (cachedStats) {
      return NextResponse.json({ stats: cachedStats });
    }

    // Get stats from Turso
    const dbStats = await getStats(addressLower);
    if (dbStats) {
      const totalGames = Number(dbStats.total_games);
      const wins = Number(dbStats.wins);
      const losses = Number(dbStats.losses);
      const ties = Number(dbStats.ties);
      const aiGames = Number(dbStats.ai_games);
      const aiWins = Number(dbStats.ai_wins);
      const aiTies = Number(dbStats.ai_ties || 0);
      const mpGames = Number(dbStats.multiplayer_games);
      const mpWins = Number(dbStats.multiplayer_wins);
      const mpTies = Number(dbStats.multiplayer_ties || 0);

      const stats = {
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
        },
        multiplayer: {
          totalGames: mpGames,
          wins: mpWins,
          losses: mpGames - mpWins - mpTies,
          ties: mpTies,
          winRate: mpGames > 0 ? Math.round((mpWins / mpGames) * 100) : 0,
        },
      };

      // Cache the stats
      await cacheManager.set(cacheKey, stats, {
        prefix: CACHE_PREFIXES.STATS,
        ttl: CACHE_DURATIONS.STATS,
      });

      return NextResponse.json({ stats });
    }

    // No stats found - cache empty result too
    const emptyStats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      ai: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
      multiplayer: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
    };

    // Cache empty stats for shorter duration
    await cacheManager.set(cacheKey, emptyStats, {
      prefix: CACHE_PREFIXES.STATS,
      ttl: 10, // Cache empty stats for only 10 seconds
    });

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
        ai: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
        multiplayer: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, result, isAI } = await request.json();

    if (!address || !result) {
      return NextResponse.json({ error: "Address and result required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();
    const isWin = result === "win";
    const isTie = result === "tie";

    // Write to Turso
    await updateStats(addressLower, isWin, isTie, isAI);

    // Invalidate cache for this user's stats
    await cacheManager.invalidate(addressLower, {
      prefix: CACHE_PREFIXES.STATS,
    });

    // Also invalidate leaderboard cache if it's an AI win
    if (isAI && isWin) {
      await cacheManager.invalidatePattern("*", {
        prefix: CACHE_PREFIXES.LEADERBOARD,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating stats:", error);
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
  }
}
