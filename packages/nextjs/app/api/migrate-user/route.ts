import { NextRequest, NextResponse } from "next/server";
import { formatBytes, validateMatchSize } from "~~/lib/migration-utils";
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

  // Get matches from Redis first (limit to avoid size issues)
  let matches: any[] = [];
  try {
    const redisMatches = await redis.lrange(`history:${addressLower}`, 0, 499); // Limit to 500 matches
    matches = redisMatches.map((m: any) => (typeof m === "string" ? JSON.parse(m) : m));
  } catch (redisError) {
    console.warn(`[Migration] Redis fetch failed for ${addressLower}, will try IPFS:`, redisError);
    matches = []; // Fall back to IPFS
  }

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

  // Prepare matches for migration
  const reversedMatches = ipfsData.matches.reverse();

  // Limit total matches to prevent huge migrations (keep last 500 matches)
  const limitedMatches = reversedMatches.slice(0, 500);

  // Process matches with size-aware chunking
  let processedCount = 0;
  let skippedCount = 0;

  try {
    // Migrate stats to Redis first
    await redis.set(`stats:${addressLower}`, ipfsData.stats);

    const totalDataSize = JSON.stringify(limitedMatches).length;
    console.log(
      `[Migration] Processing ${limitedMatches.length} matches for ${addressLower} (original: ${reversedMatches.length}, size: ${formatBytes(totalDataSize)})`,
    );

    // Clear existing history to avoid duplicates
    await redis.del(`history:${addressLower}`);
    const MAX_MATCH_SIZE = 100000; // 100KB per match (conservative)
    const BATCH_SIZE = 10; // Smaller batches

    for (let i = 0; i < limitedMatches.length; i += BATCH_SIZE) {
      const batch = limitedMatches.slice(i, i + BATCH_SIZE);
      const validMatches: string[] = [];

      // Pre-process batch to check sizes and filter
      for (const match of batch) {
        try {
          const validation = validateMatchSize(match, MAX_MATCH_SIZE);

          if (!validation.valid) {
            console.warn(`[Migration] Skipping oversized match for ${addressLower}: ${formatBytes(validation.size)}`);
            skippedCount++;
            continue;
          }

          const serializedMatch = JSON.stringify(validation.cleaned);
          validMatches.push(serializedMatch);
        } catch (serializationError) {
          console.warn(`[Migration] Skipping invalid match for ${addressLower}:`, serializationError);
          skippedCount++;
        }
      }

      // Push valid matches to Redis
      if (validMatches.length > 0) {
        // Calculate batch size to ensure we don't exceed limits
        const batchSize = validMatches.reduce((sum, match) => sum + match.length, 0);
        const batchSizeLimit = 5 * 1024 * 1024; // 5MB batch limit (conservative)

        if (batchSize > batchSizeLimit) {
          console.warn(`[Migration] Batch too large (${formatBytes(batchSize)}), processing individually`);

          // Process matches individually if batch is too large
          for (const match of validMatches) {
            try {
              await redis.lpush(`history:${addressLower}`, match);
              processedCount++;
            } catch (individualError) {
              console.error(`[Migration] Failed individual push for ${addressLower}:`, individualError);
              skippedCount++;
            }
          }
        } else {
          try {
            await redis.lpush(`history:${addressLower}`, ...validMatches);
            processedCount += validMatches.length;
          } catch (pushError) {
            console.error(`[Migration] Failed to push batch for ${addressLower}:`, pushError);

            // Fallback: try individual pushes
            for (const match of validMatches) {
              try {
                await redis.lpush(`history:${addressLower}`, match);
                processedCount++;
              } catch (individualError) {
                console.error(`[Migration] Failed individual push for ${addressLower}:`, individualError);
                skippedCount++;
              }
            }
          }
        }
      }

      // Add delay between batches to avoid rate limits
      if (i + BATCH_SIZE < limitedMatches.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const finalDataSize = await redis.llen(`history:${addressLower}`);
    console.log(
      `[Migration] Completed for ${addressLower}: ${processedCount} processed, ${skippedCount} skipped, ${finalDataSize} stored in Redis`,
    );
  } catch (migrationError) {
    console.error(`[Migration] Failed to migrate ${addressLower}:`, migrationError);
    throw new Error(`Migration failed: ${migrationError instanceof Error ? migrationError.message : "Unknown error"}`);
  }

  return {
    success: true,
    migrated: {
      stats: ipfsData.stats,
      matchesProcessed: processedCount,
      matchesSkipped: skippedCount,
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
