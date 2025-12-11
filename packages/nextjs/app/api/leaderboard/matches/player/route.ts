import { NextRequest, NextResponse } from "next/server";
import { getLeaderboardAroundPlayer, getPlayerMatchRanking } from "~~/lib/match-leaderboard";
import { withRateLimit } from "~~/lib/rate-limiter";

/**
 * Get a specific player's match-based ranking position and context
 *
 * This endpoint provides a player's ranking information based on completed AI match victories
 * (best-of-three matches), distinct from round-based rankings.
 *
 * Features:
 * 1. Gets player's match-based ranking position
 * 2. Optionally provides leaderboard context around the player
 * 3. Returns comprehensive match statistics
 * 4. Handles players not found in rankings
 *
 * GET /api/leaderboard/matches/player?address={address}&context=true&range=5
 */
export async function GET(request: NextRequest) {
  return withRateLimit(request, "leaderboard", async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const address = searchParams.get("address");
      const contextParam = searchParams.get("context");
      const rangeParam = searchParams.get("range");

      if (!address) {
        return NextResponse.json({ success: false, error: "Address parameter is required" }, { status: 400 });
      }

      // Validate address format (basic check)
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return NextResponse.json({ success: false, error: "Invalid address format" }, { status: 400 });
      }

      const includeContext = contextParam === "true";
      const range = rangeParam ? parseInt(rangeParam, 10) : 5;

      if (includeContext && (isNaN(range) || range < 1 || range > 20)) {
        return NextResponse.json({ success: false, error: "Range must be between 1 and 20" }, { status: 400 });
      }

      // Get player's match ranking
      const playerRanking = await getPlayerMatchRanking(address);

      if (!playerRanking) {
        return NextResponse.json({
          success: true,
          data: {
            player: null,
            context: [],
            message: "Player not found in match rankings",
          },
        });
      }

      // Format player data
      const formattedPlayer = {
        position: playerRanking.position,
        address: playerRanking.address,
        displayName:
          playerRanking.displayName || `${playerRanking.address.slice(0, 6)}...${playerRanking.address.slice(-4)}`,
        matchWins: playerRanking.matchWins,
        matchesPlayed: playerRanking.matchesPlayed,
        matchWinRate: playerRanking.matchWinRate,
        updatedAt: playerRanking.updatedAt,
      };

      let contextEntries: any[] = [];

      // Get leaderboard context if requested
      if (includeContext) {
        const contextData = await getLeaderboardAroundPlayer(address, range);
        contextEntries = contextData.map(entry => ({
          position: entry.position,
          address: entry.address,
          displayName: entry.displayName || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
          matchWins: entry.matchWins,
          matchesPlayed: entry.matchesPlayed,
          matchWinRate: entry.matchWinRate,
          updatedAt: entry.updatedAt,
          isCurrentPlayer: entry.address.toLowerCase() === address.toLowerCase(),
        }));
      }

      const response = {
        success: true,
        data: {
          player: formattedPlayer,
          context: contextEntries,
          leaderboardType: "matches", // Distinguish from round-based leaderboard
        },
      };

      console.log(
        `[Match Leaderboard API] Player ${address} ranking: position ${playerRanking.position}, ${playerRanking.matchWins} match wins`,
      );

      return NextResponse.json(response);
    } catch (error) {
      console.error("[Match Leaderboard API] Error fetching player match ranking:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch player match ranking",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  });
}
