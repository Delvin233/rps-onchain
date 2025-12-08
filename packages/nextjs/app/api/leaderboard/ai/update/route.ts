import { NextRequest, NextResponse } from "next/server";
import { resolveDisplayName } from "~~/lib/nameResolver";
import { getRankForWins } from "~~/lib/ranks";
import { getPlayerRank, updatePlayerWins } from "~~/lib/turso";

/**
 * Update player wins after AI match completion
 *
 * This endpoint:
 * 1. Validates the request (address, won)
 * 2. Increments player's win count
 * 3. Recalculates and updates rank
 * 4. Returns updated stats with rank change indicator
 *
 * POST /api/leaderboard/ai/update
 * Body: { address: string, won: boolean }
 */

// Rate limiting map: address -> last update timestamp
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 500; // 500ms between updates (prevents double-submission, allows fast gameplay)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, won } = body;

    // Validate request body
    if (!address || typeof address !== "string") {
      return NextResponse.json({ success: false, error: "Invalid address" }, { status: 400 });
    }

    if (typeof won !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid won parameter" }, { status: 400 });
    }

    // Only update if player won
    if (!won) {
      return NextResponse.json({
        success: true,
        message: "No update needed for loss",
      });
    }

    const lowerAddress = address.toLowerCase();

    // Rate limiting check
    const lastUpdate = rateLimitMap.get(lowerAddress);
    const now = Date.now();

    if (lastUpdate && now - lastUpdate < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastUpdate)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${waitTime} seconds.`,
        },
        { status: 429 },
      );
    }

    // Get current player data
    const existingPlayer = await getPlayerRank(lowerAddress);

    let newWins: number;
    let previousRank: string | null = null;

    if (existingPlayer) {
      newWins = existingPlayer.wins + 1;
      previousRank = existingPlayer.rank;
    } else {
      newWins = 1;
    }

    // Calculate new rank
    const newRankTier = getRankForWins(newWins);
    const rankChanged = previousRank !== null && previousRank !== newRankTier.name;

    // Resolve display name (with 2 second timeout)
    // Always try to resolve name to pick up updates (Farcaster usernames, new ENS, etc.)
    let displayName = existingPlayer?.display_name;
    try {
      const namePromise = resolveDisplayName(lowerAddress);
      const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
      const resolvedName = await Promise.race([namePromise, timeoutPromise]);

      // Only update if we got a better name (not just truncated address)
      if (resolvedName && !resolvedName.includes("...")) {
        displayName = resolvedName;
      }
    } catch {
      // Keep existing display name if resolution fails/times out
      console.log(`[Leaderboard] Name resolution failed for ${lowerAddress}, keeping existing:`, displayName);
    }

    // Update database
    const updatedPlayer = await updatePlayerWins(lowerAddress, newWins, newRankTier.name, displayName);

    // Update rate limit
    rateLimitMap.set(lowerAddress, now);

    // Clean up old rate limit entries (older than 1 minute)
    for (const [addr, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp > 60000) {
        rateLimitMap.delete(addr);
      }
    }

    console.log(
      `[Leaderboard] Updated ${lowerAddress}: ${newWins} wins → ${newRankTier.name}${
        rankChanged ? ` (ranked up from ${previousRank})` : ""
      }`,
    );

    return NextResponse.json({
      success: true,
      data: {
        address: updatedPlayer.address,
        wins: updatedPlayer.wins,
        rank: updatedPlayer.rank,
        rankChanged,
        previousRank: rankChanged ? previousRank : undefined,
      },
    });
  } catch (error) {
    console.error("[Leaderboard API] Error updating wins:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update leaderboard",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
