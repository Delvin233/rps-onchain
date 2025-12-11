import { NextRequest, NextResponse } from "next/server";
import { aiMatchManager } from "~~/lib/aiMatchManager";
import { withMetricsTracking } from "~~/lib/aiMatchMetrics";
import { withRateLimit } from "~~/lib/rate-limiter";
import { InvalidMatchStateError } from "~~/types/aiMatch";

/**
 * POST /api/ai-match/start
 *
 * Start a new best-of-three AI match for a player.
 *
 * Request body:
 * - address: Player's wallet address (required)
 *
 * Response:
 * - Success: { match: AIMatch } - New match instance
 * - Error: { error: string } - Error message
 *
 * Error cases:
 * - 400: Missing or invalid address
 * - 409: Player already has an active match
 * - 429: Player has excessive abandonment patterns (temporarily restricted)
 * - 500: Internal server error
 */
async function startMatchHandler(req: NextRequest) {
  return withRateLimit(req, "gameplay", async () => {
    try {
      const { address } = await req.json();

      // Validate required fields
      if (!address || typeof address !== "string") {
        return NextResponse.json({ error: "Valid address is required" }, { status: 400 });
      }

      // Normalize address to lowercase for consistency
      const normalizedAddress = address.toLowerCase();

      // Start new match using AIMatchManager
      const match = await aiMatchManager.startMatch(normalizedAddress);

      return NextResponse.json({ match });
    } catch (error) {
      console.error("Error starting AI match:", error);

      // Handle specific business logic errors
      if (error instanceof InvalidMatchStateError) {
        const message = error.message;

        // Check if it's an active match conflict
        if (message.includes("already has an active match")) {
          return NextResponse.json(
            { error: "You already have an active match. Please complete or abandon it before starting a new one." },
            { status: 409 },
          );
        }

        // Check if it's an abandonment restriction
        if (message.includes("excessive abandonment patterns")) {
          return NextResponse.json(
            { error: "You have abandoned too many matches recently. Please wait before starting a new match." },
            { status: 429 },
          );
        }

        // Generic invalid state error
        return NextResponse.json({ error: "Cannot start match due to invalid state" }, { status: 400 });
      }

      // Generic server error
      return NextResponse.json({ error: "Failed to start match" }, { status: 500 });
    }
  });
}

// Apply metrics tracking to the handler
export const POST = withMetricsTracking("start", startMatchHandler);
