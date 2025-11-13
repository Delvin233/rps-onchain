import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    const statsData = await redis.get(`stats:${addressLower}`);
    const stats: {
      totalGames: number;
      wins: number;
      losses: number;
      ties: number;
      winRate: number;
    } = statsData
      ? (statsData as any)
      : {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
        };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching fast stats:", error);
    return NextResponse.json({
      stats: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, result } = await request.json();

    if (!address || !result) {
      return NextResponse.json({ error: "Address and result required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Get current stats
    const statsData = await redis.get(`stats:${addressLower}`);
    const stats: {
      totalGames: number;
      wins: number;
      losses: number;
      ties: number;
      winRate: number;
    } = statsData
      ? (statsData as any)
      : {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
        };

    // Update stats
    stats.totalGames++;
    if (result === "win") stats.wins++;
    else if (result === "lose") stats.losses++;
    else if (result === "tie") stats.ties++;

    stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

    // Store updated stats
    await redis.set(`stats:${addressLower}`, stats);

    // Store match in history
    const match = {
      timestamp: new Date().toISOString(),
      result,
      player: address,
      opponent: "AI",
    };

    await redis.lpush(`history:${addressLower}`, JSON.stringify(match));

    // Check list length before trimming
    const listLength = await redis.llen(`history:${addressLower}`);

    // If list is about to exceed 100, auto-sync to IPFS first
    if (listLength >= 100) {
      try {
        // Get all matches before trimming
        const allMatches = await redis.lrange(`history:${addressLower}`, 0, -1);
        const parsedMatches = allMatches.map((m: any) => (typeof m === "string" ? JSON.parse(m) : m));

        // Sync to IPFS
        await fetch(`${request.nextUrl.origin}/api/sync-ipfs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, matches: parsedMatches }),
        });
      } catch (error) {
        console.error("Auto-sync to IPFS failed:", error);
        // Continue anyway - don't block the game
      }
    }

    await redis.ltrim(`history:${addressLower}`, 0, 99); // Keep last 100

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error updating fast stats:", error);
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
  }
}
