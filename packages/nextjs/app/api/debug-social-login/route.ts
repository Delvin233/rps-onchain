import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatchCount, getPlayerMatchHistory } from "~~/lib/aiMatchStorage";
import { getMatchHistory } from "~~/lib/tursoStorage";
import { redis } from "~~/lib/upstash";

/**
 * Debug endpoint to help diagnose social login address issues
 * GET /api/debug-social-login?address=0x...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const debugInfo: any = {
      originalAddress: address,
      lowerAddress: address.toLowerCase(),
      upperAddress: address.toUpperCase(),
      checksumAddress: address, // Keep original for comparison
      matches: {
        found: [] as any[],
        aiMatches: {
          count: 0,
          matches: [] as any[],
        },
        multiplayerMatches: {
          count: 0,
          matches: [] as any[],
        },
      },
      storage: {
        redis: {
          keys: [] as string[],
          historyKey: `history:${address.toLowerCase()}`,
        },
        turso: {
          aiMatchesFound: 0,
          multiplayerMatchesFound: 0,
        },
      },
    };

    // Test different address formats
    const addressVariants = [address, address.toLowerCase(), address.toUpperCase()];

    console.log(`[Debug Social Login] Testing address variants:`, addressVariants);

    // Check AI matches for each variant
    for (const addr of addressVariants) {
      try {
        const aiCount = await getPlayerMatchCount(addr);
        const aiMatches = await getPlayerMatchHistory(addr, 10);

        if (aiCount > 0 || aiMatches.length > 0) {
          debugInfo.matches.aiMatches = {
            count: aiCount,
            matches: aiMatches.slice(0, 3), // Just first 3 for debugging
          };
          console.log(`[Debug Social Login] Found ${aiCount} AI matches for address variant: ${addr}`);
          break;
        }
      } catch (error) {
        console.error(`[Debug Social Login] Error checking AI matches for ${addr}:`, error);
      }
    }

    // Check multiplayer matches for each variant
    for (const addr of addressVariants) {
      try {
        const lowerAddress = addr.toLowerCase();
        const redisMatches = await redis.lrange(`history:${lowerAddress}`, 0, 99);
        const tursoMatches = await getMatchHistory(lowerAddress, 100);

        debugInfo.matches.found = [
          ...redisMatches.map((m: any) => ({ source: "redis", data: typeof m === "string" ? JSON.parse(m) : m })),
          ...tursoMatches.map((m: any) => ({ source: "turso", data: m })),
        ];

        if (debugInfo.matches.found.length > 0) {
          debugInfo.matches.multiplayerMatches = {
            count: debugInfo.matches.found.length,
            matches: debugInfo.matches.found.slice(0, 3), // Just first 3 for debugging
          };
          console.log(
            `[Debug Social Login] Found ${debugInfo.matches.found.length} multiplayer matches for address variant: ${addr}`,
          );
          break;
        }
      } catch (error) {
        console.error(`[Debug Social Login] Error checking multiplayer matches for ${addr}:`, error);
      }
    }

    // Check Redis keys
    try {
      const redisKeys = await redis.keys(`*${address.toLowerCase()}*`);
      debugInfo.storage.redis.keys = redisKeys;
    } catch (error) {
      console.error(`[Debug Social Login] Error checking Redis keys:`, error);
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error("Error in debug social login:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/debug-social-login
 * Create a test match for debugging
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    // Create a test match entry in Redis to verify storage/retrieval
    const testMatch = {
      roomId: `test-${Date.now()}`,
      players: {
        creator: address.toLowerCase(),
        joiner: "0xtest",
      },
      moves: {
        creatorMove: "rock",
        joinerMove: "scissors",
      },
      result: {
        winner: address.toLowerCase(),
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      opponent: "test-opponent",
    };

    // Store in Redis
    await redis.lpush(`history:${address.toLowerCase()}`, JSON.stringify(testMatch));

    return NextResponse.json({
      success: true,
      message: "Test match created",
      testMatch,
      storedAt: `history:${address.toLowerCase()}`,
    });
  } catch (error: any) {
    console.error("Error creating test match:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
