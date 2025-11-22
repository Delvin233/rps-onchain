import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

// Batched endpoint: Get stats + history in one call using Redis pipeline
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Use Redis pipeline to batch multiple commands into one network call
    const pipeline = redis.pipeline();
    pipeline.get(`stats:${addressLower}`);
    pipeline.lrange(`history:${addressLower}`, 0, 99);

    const results = await pipeline.exec();

    // Parse results
    const statsData = results[0] as any;
    const historyData = results[1] as any[];

    const stats = statsData || {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      ai: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
      multiplayer: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
    };

    // Ensure ai and multiplayer exist
    if (!stats.ai) stats.ai = { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 };
    if (!stats.multiplayer) stats.multiplayer = { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 };

    const matches = historyData.map((m: any) => (typeof m === "string" ? JSON.parse(m) : m));

    return NextResponse.json({ stats, matches });
  } catch (error) {
    console.error("Error fetching player data:", error);
    return NextResponse.json(
      {
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
          ai: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
          multiplayer: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 },
        },
        matches: [],
      },
      { status: 500 },
    );
  }
}
