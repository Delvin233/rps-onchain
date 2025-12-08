import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "~~/lib/turso";

/**
 * Get AI leaderboard rankings with pagination
 *
 * This endpoint:
 * 1. Parses query parameters (limit, offset)
 * 2. Validates parameters
 * 3. Queries database with pagination
 * 4. Returns paginated results with total count
 *
 * GET /api/leaderboard/ai?limit=50&offset=0
 */

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    // Parse and validate parameters
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ success: false, error: "Invalid limit parameter" }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ success: false, error: "Invalid offset parameter" }, { status: 400 });
    }

    if (limit > 100) {
      return NextResponse.json({ success: false, error: "Limit cannot exceed 100" }, { status: 400 });
    }

    // Check cache
    const cacheKey = `leaderboard:${limit}:${offset}`;
    const cachedEntry = cache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL_MS) {
      console.log(`[Leaderboard API] Cache hit for ${cacheKey}`);
      return NextResponse.json(cachedEntry.data);
    }

    // Query database
    const { entries, total } = await getLeaderboard(limit, offset);

    // Calculate positions and format entries
    const formattedEntries = entries.map((entry, index) => ({
      position: offset + index + 1,
      address: entry.address,
      displayName: entry.display_name || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
      wins: entry.wins,
      rank: entry.rank,
      updatedAt: entry.updated_at,
    }));

    const hasMore = offset + entries.length < total;

    const response = {
      success: true,
      data: {
        entries: formattedEntries,
        total,
        hasMore,
        limit,
        offset,
      },
    };

    // Update cache
    cache.set(cacheKey, { data: response, timestamp: now });

    // Clean up old cache entries (older than 1 minute)
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > 60000) {
        cache.delete(key);
      }
    }

    console.log(`[Leaderboard API] Fetched ${entries.length} entries (offset: ${offset}, total: ${total})`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Leaderboard API] Error fetching leaderboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch leaderboard",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
