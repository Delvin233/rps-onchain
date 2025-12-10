import { NextRequest, NextResponse } from "next/server";
import { aiMatchManager } from "~~/lib/aiMatchManager";
import { withRateLimit } from "~~/lib/rate-limiter";

/**
 * GET /api/ai-match/resume?address=<address>
 *
 * Detect and return any active match for a player to enable resumption.
 *
 * Query parameters:
 * - address: Player's wallet address (required)
 *
 * Response:
 * - Success: { match: AIMatch | null } - Active match or null if none exists
 * - Error: { error: string } - Error message
 *
 * Error cases:
 * - 400: Missing or invalid address
 * - 500: Internal server error
 *
 * Note: This endpoint returns null for match if no active match exists,
 * rather than a 404 error, to allow clients to easily check without error handling.
 * If a match is found but has expired, it will be automatically abandoned and
 * null will be returned.
 */
export async function GET(req: NextRequest) {
  return withRateLimit(req, "stats", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const address = searchParams.get("address");

      // Validate required parameters
      if (!address || typeof address !== "string") {
        return NextResponse.json({ error: "Valid address parameter is required" }, { status: 400 });
      }

      // Normalize address to lowercase for consistency
      const normalizedAddress = address.toLowerCase();

      // Get active match for player using AIMatchManager
      const match = await aiMatchManager.getActiveMatchForPlayer(normalizedAddress);

      return NextResponse.json({ match });
    } catch (error) {
      console.error("Error getting active match for player:", error);

      // Generic server error
      return NextResponse.json({ error: "Failed to get active match" }, { status: 500 });
    }
  });
}
