import { NextRequest, NextResponse } from "next/server";
import { getNextRank } from "~~/lib/ranks";
import { getPlayerPosition, getPlayerRank } from "~~/lib/turso";

/**
 * Get specific player's rank and position
 *
 * This endpoint:
 * 1. Validates address parameter
 * 2. Queries player data from database
 * 3. Calculates player position
 * 4. Calculates next rank and wins needed
 * 5. Returns player stats
 *
 * GET /api/leaderboard/ai/player?address={address}
 */

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60000; // 1 minute

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    // Validate address
    if (!address || typeof address !== "string") {
      return NextResponse.json({ success: false, error: "Address parameter is required" }, { status: 400 });
    }

    // Basic address format validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ success: false, error: "Invalid address format" }, { status: 400 });
    }

    const lowerAddress = address.toLowerCase();

    // Check cache
    const cacheKey = `player:${lowerAddress}`;
    const cachedEntry = cache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL_MS) {
      console.log(`[Leaderboard API] Cache hit for player ${lowerAddress}`);
      return NextResponse.json(cachedEntry.data);
    }

    // Query player data
    const player = await getPlayerRank(lowerAddress);

    if (!player) {
      // Player not found - return unranked status
      return NextResponse.json({
        success: true,
        data: {
          address: lowerAddress,
          displayName: `${lowerAddress.slice(0, 6)}...${lowerAddress.slice(-4)}`,
          wins: 0,
          rank: "Unranked",
          position: 0,
          nextRank: {
            name: "Beginner",
            winsNeeded: 1,
          },
        },
      });
    }

    // Get player position
    const position = await getPlayerPosition(lowerAddress);

    // Calculate next rank
    const nextRankInfo = getNextRank(player.wins);

    const response = {
      success: true,
      data: {
        address: player.address,
        displayName: player.display_name || `${player.address.slice(0, 6)}...${player.address.slice(-4)}`,
        wins: player.wins,
        rank: player.rank,
        position,
        nextRank: nextRankInfo
          ? {
              name: nextRankInfo.rank.name,
              winsNeeded: nextRankInfo.winsNeeded,
            }
          : null,
        updatedAt: player.updated_at,
      },
    };

    // Update cache
    cache.set(cacheKey, { data: response, timestamp: now });

    // Clean up old cache entries (older than 2 minutes)
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > 120000) {
        cache.delete(key);
      }
    }

    console.log(`[Leaderboard API] Fetched player ${lowerAddress}: ${player.rank} (#${position})`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Leaderboard API] Error fetching player rank:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch player rank",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
