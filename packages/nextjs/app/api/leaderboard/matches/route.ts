import { NextRequest, NextResponse } from "next/server";
import { getMatchLeaderboard } from "~~/lib/match-leaderboard";
import { withRateLimit } from "~~/lib/rate-limiter";

/**
 * Get match-based leaderboard rankings with pagination
 *
 * This endpoint provides leaderboard rankings based on completed AI match victories
 * (best-of-three matches), distinct from round-based rankings.
 *
 * Features:
 * 1. Parses query parameters (limit, offset, minMatches)
 * 2. Validates parameters
 * 3. Queries database with proper sorting and tie-breaking
 * 4. Returns paginated results with match-based statistics
 *
 * Sorting criteria:
 * 1. Match wins (descending)
 * 2. Match win rate (descending) - for tie-breaking
 * 3. Total matches played (descending) - for further tie-breaking
 * 4. Address (ascending) - for consistent ordering
 *
 * GET /api/leaderboard/matches?limit=50&offset=0&minMatches=1
 */
export async function GET(request: NextRequest) {
  return withRateLimit(request, "leaderboard", async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const limitParam = searchParams.get("limit");
      const offsetParam = searchParams.get("offset");
      const minMatchesParam = searchParams.get("minMatches");

      // Parse and validate parameters
      const limit = limitParam ? parseInt(limitParam, 10) : 50;
      const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
      const minMatches = minMatchesParam ? parseInt(minMatchesParam, 10) : 0;

      if (isNaN(limit) || limit < 1) {
        return NextResponse.json({ success: false, error: "Invalid limit parameter" }, { status: 400 });
      }

      if (isNaN(offset) || offset < 0) {
        return NextResponse.json({ success: false, error: "Invalid offset parameter" }, { status: 400 });
      }

      if (limit > 100) {
        return NextResponse.json({ success: false, error: "Limit cannot exceed 100" }, { status: 400 });
      }

      if (isNaN(minMatches) || minMatches < 0) {
        return NextResponse.json({ success: false, error: "Invalid minMatches parameter" }, { status: 400 });
      }

      // Query match-based leaderboard
      const result = await getMatchLeaderboard({ limit, offset, minMatches });

      // Format entries for API response
      const formattedEntries = result.entries.map(entry => ({
        position: entry.position,
        address: entry.address,
        displayName: entry.displayName || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
        matchWins: entry.matchWins,
        matchesPlayed: entry.matchesPlayed,
        matchWinRate: entry.matchWinRate,
        updatedAt: entry.updatedAt,
      }));

      const response = {
        success: true,
        data: {
          entries: formattedEntries,
          total: result.total,
          hasMore: result.hasMore,
          limit: result.limit,
          offset: result.offset,
          leaderboardType: "matches", // Distinguish from round-based leaderboard
        },
      };

      console.log(
        `[Match Leaderboard API] Fetched ${result.entries.length} entries (offset: ${offset}, total: ${result.total}, minMatches: ${minMatches})`,
      );

      return NextResponse.json(response);
    } catch (error) {
      console.error("[Match Leaderboard API] Error fetching match leaderboard:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch match leaderboard",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  });
}
