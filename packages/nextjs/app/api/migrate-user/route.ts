import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

async function migrateUser(address: string, origin: string) {
  const addressLower = address.toLowerCase();

  // Check if user already has Redis data with proper AI/multiplayer split
  const existingStats: any = await redis.get(`stats:${addressLower}`);
  if (
    existingStats &&
    existingStats.ai &&
    existingStats.multiplayer &&
    existingStats.ai.totalGames + existingStats.multiplayer.totalGames === existingStats.totalGames
  ) {
    return { message: "User already migrated", stats: existingStats };
  }

  // Get matches from Redis first
  const redisMatches = await redis.lrange(`history:${addressLower}`, 0, -1);
  let matches = redisMatches.map((m: any) => JSON.parse(m));

  // If no Redis data, try IPFS
  if (matches.length === 0) {
    const hashResponse = await fetch(`${origin}/api/user-matches?address=${address}`);
    const { ipfsHash } = await hashResponse.json();

    if (!ipfsHash) {
      return { message: "No data found" };
    }

    const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    const ipfsData = await ipfsResponse.json();
    matches = ipfsData.matches || [];
  }

  if (matches.length === 0) {
    return { message: "No matches found" };
  }

  // Calculate stats from matches
  const aiMatches = matches.filter((m: any) => m.opponent === "AI" || m.opponentMove);
  const multiMatches = matches.filter((m: any) => m.opponent !== "AI" && !m.opponentMove && (m.roomId || m.players));

  const calcStats = (matchList: any[]) => {
    const wins = matchList.filter(
      (m: any) => m.result === "win" || (typeof m.result === "object" && m.result.winner === address),
    ).length;
    const ties = matchList.filter(
      (m: any) => m.result === "tie" || (typeof m.result === "object" && m.result.winner === "tie"),
    ).length;
    const total = matchList.length;
    return {
      totalGames: total,
      wins,
      losses: total - wins - ties,
      ties,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    };
  };

  const aiStats = calcStats(aiMatches);
  const multiStats = calcStats(multiMatches);
  const totalStats = calcStats(matches);

  const ipfsData = {
    stats: { ...totalStats, ai: aiStats, multiplayer: multiStats },
    matches,
  };

  // Migrate stats to Redis
  await redis.set(`stats:${addressLower}`, ipfsData.stats);

  // Migrate matches to Redis
  for (const match of ipfsData.matches.reverse()) {
    await redis.lpush(`history:${addressLower}`, JSON.stringify(match));
  }

  return {
    success: true,
    migrated: {
      stats: ipfsData.stats,
      matches: ipfsData.matches.length,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const result = await migrateUser(address, request.nextUrl.origin);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const result = await migrateUser(address, request.nextUrl.origin);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
