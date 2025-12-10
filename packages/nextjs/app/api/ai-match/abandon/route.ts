import { NextRequest, NextResponse } from "next/server";
import { aiMatchManager } from "~~/lib/aiMatchManager";
import { withRateLimit } from "~~/lib/rate-limiter";
import { InvalidMatchStateError, MatchNotFoundError } from "~~/types/aiMatch";

/**
 * POST /api/ai-match/abandon
 *
 * Abandon an active AI match. The match will be marked as abandoned,
 * the AI will be declared the winner, and abandonment patterns will be tracked.
 *
 * Request body:
 * - matchId: Match identifier (required)
 *
 * Response:
 * - Success: { match: AIMatch } - Abandoned match state
 * - Error: { error: string } - Error message
 *
 * Error cases:
 * - 400: Missing or invalid matchId
 * - 404: Match not found
 * - 409: Match is not active (already completed or abandoned)
 * - 500: Internal server error
 */
export async function POST(req: NextRequest) {
  return withRateLimit(req, "gameplay", async () => {
    try {
      const { matchId } = await req.json();

      // Validate required fields
      if (!matchId || typeof matchId !== "string") {
        return NextResponse.json({ error: "Valid matchId is required" }, { status: 400 });
      }

      // Abandon match using AIMatchManager
      const match = await aiMatchManager.abandonMatchById(matchId);

      return NextResponse.json({ match });
    } catch (error) {
      console.error("Error abandoning match:", error);

      // Handle specific business logic errors
      if (error instanceof MatchNotFoundError) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }

      if (error instanceof InvalidMatchStateError) {
        return NextResponse.json({ error: "Match cannot be abandoned (not active)" }, { status: 409 });
      }

      // Generic server error
      return NextResponse.json({ error: "Failed to abandon match" }, { status: 500 });
    }
  });
}
