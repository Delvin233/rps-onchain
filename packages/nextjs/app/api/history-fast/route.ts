import { NextRequest, NextResponse } from "next/server";
import { resilientSaveMatch } from "~~/lib/resilient-database";
import { redis } from "~~/lib/upstash";

export async function POST(request: NextRequest) {
  try {
    const { address, match } = await request.json();

    if (!address || !match) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();
    const key = `history:${addressLower}`;

    // Store in Redis (cache) - longer TTL for match history (30 days)
    await redis.lpush(key, JSON.stringify(match));
    await redis.ltrim(key, 0, 99);
    await redis.expire(key, 60 * 60 * 24 * 30); // 30 days instead of 7

    // Store in database using resilient operations
    const players = [match.players?.creator, match.players?.joiner, match.player, match.opponent].filter(Boolean);
    if (players.length >= 2) {
      const winner = typeof match.result === "object" ? match.result.winner : match.result;
      const success = await resilientSaveMatch({
        roomId: match.roomId || `match_${Date.now()}`,
        player1: players[0]?.toLowerCase(),
        player2: players[1]?.toLowerCase(),
        player1Move: match.moves?.creatorMove || match.playerMove || "unknown",
        player2Move: match.moves?.joinerMove || match.opponentMove || "unknown",
        winner: winner === "tie" || winner === "Tie" ? null : winner?.toLowerCase(),
        gameMode: match.opponent === "AI" ? "ai" : "multiplayer",
        timestampMs: typeof match.result === "object" ? match.result.timestamp : match.timestamp || Date.now(),
        ipfsHash: match.ipfsHash,
      });

      if (!success) {
        console.warn(`[History Fast] Database storage failed gracefully for match ${match.roomId || "unknown"}`);
        // Still return success since we have Redis cache
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing match history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
