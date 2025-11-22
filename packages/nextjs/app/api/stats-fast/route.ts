import { NextRequest, NextResponse } from "next/server";
import { getStats, updateStats } from "~~/lib/tursoStorage";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Try Redis cache first
    const cached = await redis.get(`stats:${addressLower}`);
    if (cached) {
      return NextResponse.json({ stats: cached });
    }

    // Fallback to Turso
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
      // Cache for 5 minutes
      await redis.set(`stats:${addressLower}`, stats, { ex: 300 });
      return NextResponse.json({ stats });
    }

    // No stats found
    const emptyStats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      ai: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
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

    // Write to Turso (source of truth)
    await updateStats(addressLower, isWin, isTie, isAI);

    // Invalidate Redis cache
    await redis.del(`stats:${addressLower}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating stats:", error);
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
  }
}
