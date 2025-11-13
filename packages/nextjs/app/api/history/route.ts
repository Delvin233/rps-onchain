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

    const [matches, statsData] = await Promise.all([
      redis.lrange(`history:${addressLower}`, 0, 49),
      redis.get(`stats:${addressLower}`)
    ]);
    
    const stats = statsData ? statsData : { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 };

    return NextResponse.json({
      matches: matches.map(m => JSON.parse(m)),
      stats,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ matches: [] });
  }
}
