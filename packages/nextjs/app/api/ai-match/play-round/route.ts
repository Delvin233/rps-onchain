import { NextRequest, NextResponse } from "next/server";
import { aiMatchManager } from "~~/lib/aiMatchManager";
import { withMetricsTracking } from "~~/lib/aiMatchMetrics";
import { withRateLimit } from "~~/lib/rate-limiter";
import {
  InvalidMatchStateError,
  MatchAbandonedError,
  MatchCompletedError,
  MatchNotFoundError,
  Move,
} from "~~/types/aiMatch";

/**
 * POST /api/ai-match/play-round
 *
 * Play a round in an existing AI match.
 *
 * Request body:
 * - matchId: Match identifier (required)
 * - playerMove: Player's move - "rock", "paper", or "scissors" (required)
 *
 * Response:
 * - Success: { match: AIMatch, roundResult: RoundResult } - Updated match state and round outcome
 * - Error: { error: string } - Error message
 *
 * Error cases:
 * - 400: Missing or invalid matchId/playerMove
 * - 404: Match not found
 * - 409: Match already completed or abandoned
 * - 500: Internal server error
 */
async function playRoundHandler(req: NextRequest) {
  return withRateLimit(req, "gameplay", async () => {
    try {
      const { matchId, playerMove } = await req.json();

      // Validate required fields
      if (!matchId || typeof matchId !== "string") {
        return NextResponse.json({ error: "Valid matchId is required" }, { status: 400 });
      }

      if (!playerMove || !["rock", "paper", "scissors"].includes(playerMove)) {
        return NextResponse.json({ error: "Valid playerMove is required (rock, paper, or scissors)" }, { status: 400 });
      }

      // Play round using AIMatchManager
      const result = await aiMatchManager.playRound(matchId, playerMove as Move);

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error playing round:", error);

      // Handle specific business logic errors
      if (error instanceof MatchNotFoundError) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }

      if (error instanceof MatchCompletedError) {
        return NextResponse.json({ error: "Match is already completed" }, { status: 409 });
      }

      if (error instanceof MatchAbandonedError) {
        return NextResponse.json({ error: "Match has been abandoned" }, { status: 409 });
      }

      if (error instanceof InvalidMatchStateError) {
        return NextResponse.json({ error: "Invalid match state for playing a round" }, { status: 409 });
      }

      // Generic server error
      return NextResponse.json({ error: "Failed to play round" }, { status: 500 });
    }
  });
}

// Apply metrics tracking to the handler
export const POST = withMetricsTracking("playRound", playRoundHandler);
