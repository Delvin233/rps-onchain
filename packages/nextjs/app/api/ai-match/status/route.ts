import { NextRequest, NextResponse } from "next/server";
import { aiMatchManager } from "~~/lib/aiMatchManager";
import { withRateLimit } from "~~/lib/rate-limiter";

/**
 * GET /api/ai-match/status?matchId=<id>
 *
 * Get the current status of an AI match.
 *
 * Query parameters:
 * - matchId: Match identifier (required)
 *
 * Response:
 * - Success: { match: AIMatch | null } - Current match state or null if not found
 * - Error: { error: string } - Error message
 *
 * Error cases:
 * - 400: Missing or invalid matchId
 * - 500: Internal server error
 *
 * Note: This endpoint returns null for match if not found, rather than a 404 error,
 * to allow clients to easily check if a match exists without error handling.
 */
export async function GET(req: NextRequest) {
  return withRateLimit(req, "stats", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const matchId = searchParams.get("matchId");

      // Validate required parameters
      if (!matchId || typeof matchId !== "string") {
        return NextResponse.json({ error: "Valid matchId parameter is required" }, { status: 400 });
      }

      // Get match status using AIMatchManager
      const match = await aiMatchManager.getMatchStatus(matchId);

      return NextResponse.json({ match });
    } catch (error) {
      console.error("Error getting match status:", error);

      // Generic server error
      return NextResponse.json({ error: "Failed to get match status" }, { status: 500 });
    }
  });
}
