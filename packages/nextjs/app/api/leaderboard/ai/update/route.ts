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

    // Verify the match exists in Redis history (anti-cheat)
    // NOTE: This is lenient during migration - old matches don't have IDs
    try {
      const historyResponse = await fetch(`${request.nextUrl.origin}/api/user-matches?address=${lowerAddress}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const matches = historyData.matches || [];

        // Check if this matchId exists in recent history
        const matchWithId = matches.find((match: any) => match.id === matchId);

        if (matchWithId) {
          // Perfect! Match found with ID
          if (matchWithId.opponent !== "AI" || matchWithId.result !== "win") {
            console.warn(`[Leaderboard] Match ${matchId} is not an AI win`);
            return NextResponse.json(
              {
                success: false,
                error: "Match is not an AI win",
              },
              { status: 403 },
            );
          }
        } else {
          // Match ID not found - could be old match without ID
          // Check if user has recent AI wins (lenient check during migration)
          const recentAIWins = matches.filter((match: any) => match.opponent === "AI" && match.result === "win").length;

          if (recentAIWins === 0) {
            console.warn(`[Leaderboard] No recent AI wins found for ${lowerAddress}`);
            return NextResponse.json(
              {
                success: false,
                error: "No recent AI wins found",
              },
              { status: 403 },
            );
          }

          // User has recent AI wins, allow update (lenient during migration)
          console.log(`[Leaderboard] Match ${matchId} not found but user has ${recentAIWins} recent AI wins, allowing`);
        }
      } else {
        console.warn(`[Leaderboard] Could not verify match history for ${lowerAddress}`);
        // Allow update even if history check fails (Redis might be down)
      }
    } catch (error) {
      console.error(`[Leaderboard] Error verifying match:`, error);
      // Allow update even if verification fails (don't block legitimate users)
    }

    // Get current player data (for rank change detection and name resolution)
    const existingPlayer = await getPlayerRank(lowerAddress);
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
