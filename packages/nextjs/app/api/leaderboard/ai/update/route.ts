import { NextRequest, NextResponse } from "next/server";
import { resolveDisplayName } from "~~/lib/nameResolver";
import { getRankForWins } from "~~/lib/ranks";
import { getPlayerRank, incrementPlayerWins } from "~~/lib/turso";

/**
 * Update player wins after AI match completion
 *
 * This endpoint:
 * 1. Validates the request (address, won, matchId)
 * 2. Verifies the match exists and is a win
 * 3. Increments player's win count (atomic)
 * 4. Recalculates and updates rank
 * 5. Returns updated stats with rank change indicator
 *
 * POST /api/leaderboard/ai/update
 * Body: { address: string, won: boolean, matchId: string }
 */

// Track processed matches to prevent double-counting
const processedMatches = new Map<string, number>();
const PROCESSED_TTL_MS = 300000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, won, matchId } = body;

    // Validate request body
    if (!address || typeof address !== "string") {
      return NextResponse.json({ success: false, error: "Invalid address" }, { status: 400 });
    }

    if (typeof won !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid won parameter" }, { status: 400 });
    }

    if (!matchId || typeof matchId !== "string") {
      return NextResponse.json({ success: false, error: "Invalid matchId" }, { status: 400 });
    }

    // Only update if player won
    if (!won) {
      return NextResponse.json({
        success: true,
        message: "No update needed for loss",
      });
    }

    const lowerAddress = address.toLowerCase();

    // Check if this match was already processed (prevents double-counting)
    const now = Date.now();
    const lastProcessed = processedMatches.get(matchId);

    if (lastProcessed && now - lastProcessed < PROCESSED_TTL_MS) {
      console.log(`[Leaderboard] Match ${matchId} already processed, skipping`);
      return NextResponse.json({
        success: true,
        message: "Match already processed",
      });
    }

    // Get current player data (for verification and rank change detection)
    const existingPlayer = await getPlayerRank(lowerAddress);

    // Verify using leaderboard data (anti-cheat)
    // Compare current leaderboard wins with stats to detect manipulation
    try {
      const statsResponse = await fetch(`${request.nextUrl.origin}/api/stats-fast?address=${lowerAddress}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const statsAIWins = statsData?.stats?.ai?.wins || 0;
        const currentLeaderboardWins = existingPlayer?.wins || 0;

        console.log(
          `[Leaderboard] Verification for ${lowerAddress}: stats=${statsAIWins}, leaderboard=${currentLeaderboardWins}`,
        );

        // Anti-cheat check: Leaderboard wins should never exceed stats wins
        // Allow a small buffer (+5) for race conditions and timing issues
        if (currentLeaderboardWins > statsAIWins + 5) {
          console.warn(
            `[Leaderboard] BLOCKED: Leaderboard wins (${currentLeaderboardWins}) significantly exceed stats wins (${statsAIWins}) for ${lowerAddress}`,
          );
          return NextResponse.json(
            {
              success: false,
              error: "Leaderboard wins exceed stats wins",
            },
            { status: 403 },
          );
        }

        // Log large differences for monitoring (but still allow)
        const winDifference = statsAIWins - currentLeaderboardWins;
        if (winDifference > 50) {
          console.warn(
            `[Leaderboard] Large win difference (${winDifference}) for ${lowerAddress}: stats=${statsAIWins}, leaderboard=${currentLeaderboardWins}`,
          );
        }
      } else {
        console.warn(`[Leaderboard] Could not verify stats for ${lowerAddress}, allowing update`);
      }
    } catch (error) {
      console.error(`[Leaderboard] Error verifying:`, error);
      // Allow update even if verification fails (don't block legitimate users)
    }
    const previousRank = existingPlayer?.rank || null;
    const previousWins = existingPlayer?.wins || 0;

    // Calculate what the new rank will be after incrementing
    const newWins = previousWins + 1;
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

    // Atomically increment wins in database (prevents race conditions)
    const updatedPlayer = await incrementPlayerWins(lowerAddress, newRankTier.name, displayName);

    // Mark this match as processed
    processedMatches.set(matchId, now);

    // Clean up old processed matches (older than TTL)
    for (const [id, timestamp] of processedMatches.entries()) {
      if (now - timestamp > PROCESSED_TTL_MS) {
        processedMatches.delete(id);
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
