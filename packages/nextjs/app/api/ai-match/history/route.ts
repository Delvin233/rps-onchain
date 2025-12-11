import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatchCount, getPlayerMatchHistory } from "~~/lib/aiMatchStorage";

/**
 * GET /api/ai-match/history
 *
 * Fetch AI match history for a player from Turso database.
 * Returns completed AI matches with round-by-round details.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId parameter" }, { status: 400 });
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Validate parameters
    if (limit < 1 || limit > 200) {
      return NextResponse.json({ error: "Limit must be between 1 and 200" }, { status: 400 });
    }

    if (offset < 0) {
      return NextResponse.json({ error: "Offset must be non-negative" }, { status: 400 });
    }

    // Fetch match history and total count
    const [matches, totalCount] = await Promise.all([
      getPlayerMatchHistory(playerId, limit, offset),
      getPlayerMatchCount(playerId),
    ]);

    return NextResponse.json({
      matches,
      totalCount,
      limit,
      offset,
      hasMore: offset + matches.length < totalCount,
    });
  } catch (error) {
    console.error("Error fetching AI match history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
