import { NextRequest, NextResponse } from "next/server";
import { resilientGetLeaderboard } from "~~/lib/resilient-database";

/**
 * Get AI leaderboard rankings with pagination
 *
 * This endpoint:
 * 1. Parses query parameters (limit, offset)
 * 2. Validates parameters
 * 3. Queries database with resilient operations (circuit breaker, retry, cache fallback)
 * 4. Returns paginated results
 *
 * GET /api/leaderboard/ai?limit=50&offset=0
 */

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

    // Query database using resilient operations
    // This includes circuit breaker, retry logic, and fallback to cache
    const entries = await resilientGetLeaderboard(limit, offset);

    // Ensure entries is always an array
    const entriesArray = Array.isArray(entries) ? entries : [];

    // Calculate positions and format entries
    const formattedEntries = entriesArray.map((entry, index) => ({
      position: offset + index + 1,
      address: entry.address,
      displayName: entry.display_name || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
      wins: entry.wins,
      rank: entry.rank,
      updatedAt: entry.updated_at,
    }));

    // For resilient operations, we estimate total and hasMore based on returned data
    const hasMore = entriesArray.length === limit;
    const estimatedTotal = hasMore ? offset + entriesArray.length + 1 : offset + entriesArray.length;

    const response = {
      success: true,
      data: {
        entries: formattedEntries,
        total: estimatedTotal,
        hasMore,
        limit,
        offset,
      },
    };

    console.log(
      `[Leaderboard API] Fetched ${entriesArray.length} entries (offset: ${offset}, estimated total: ${estimatedTotal})`,
    );

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
