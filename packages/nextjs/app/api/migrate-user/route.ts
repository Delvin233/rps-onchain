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
  let matches = redisMatches.map((m: any) => (typeof m === "string" ? JSON.parse(m) : m));

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

  // Prepare matches for migration (outside try block for scope)
  const BATCH_SIZE = 25; // Smaller batches for safety
  const reversedMatches = ipfsData.matches.reverse();

  // Limit total matches to prevent huge migrations (keep last 500 matches)
  const limitedMatches = reversedMatches.slice(0, 500);

  try {
    // Migrate stats to Redis
    await redis.set(`stats:${addressLower}`, ipfsData.stats);

    // Migrate matches to Redis in batches to avoid size limits

    console.log(
      `[Migration] Processing ${limitedMatches.length} matches for ${addressLower} (original: ${reversedMatches.length})`,
    );

    for (let i = 0; i < limitedMatches.length; i += BATCH_SIZE) {
      const batch = limitedMatches.slice(i, i + BATCH_SIZE);

      // Process each match individually to avoid size issues
      for (const match of batch) {
        const serializedMatch = JSON.stringify(match);

        // Check size before pushing (Redis limit is ~10MB, be safe with 1MB per item)
        if (serializedMatch.length > 1000000) {
          // 1MB limit per match
          console.warn(`[Migration] Skipping oversized match for ${addressLower}: ${serializedMatch.length} bytes`);
          continue;
        }

        await redis.lpush(`history:${addressLower}`, serializedMatch);
      }

      // Small delay between batches
      if (i + BATCH_SIZE < limitedMatches.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  } catch (migrationError) {
    console.error(`[Migration] Failed to migrate ${addressLower}:`, migrationError);
    throw new Error(`Migration failed: ${migrationError instanceof Error ? migrationError.message : "Unknown error"}`);
  }

  return {
    success: true,
    migrated: {
      stats: ipfsData.stats,
      matches: limitedMatches.length,
      originalMatches: ipfsData.matches.length,
      truncated: ipfsData.matches.length > 500,
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
