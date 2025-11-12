import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";

let redis: ReturnType<typeof createClient> | null = null;

const getRedis = async () => {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  }
  return redis;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const client = await getRedis();
    const addressLower = address.toLowerCase();

    const matches = await client.lRange(`history:${addressLower}`, 0, 49);
    const statsData = await client.get(`stats:${addressLower}`);
    const stats = statsData ? JSON.parse(statsData) : { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 };

    return NextResponse.json({
      matches: matches.map(m => JSON.parse(m)),
      stats,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ matches: [] });
  }
}
