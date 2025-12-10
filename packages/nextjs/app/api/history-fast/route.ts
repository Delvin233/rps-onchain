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

    // Store in Redis (cache)
    await redis.lpush(key, JSON.stringify(match));
    await redis.ltrim(key, 0, 99);
    await redis.expire(key, 60 * 60 * 24 * 7);

    // Store in database using resilient operations
    const players = [match.players?.creator, match.players?.joiner].filter(Boolean);
    if (players.length >= 2) {
      const winner = typeof match.result === "object" ? match.result.winner : null;
      const success = await resilientSaveMatch({
        roomId: match.roomId,
        player1: players[0],
        player2: players[1],
        player1Move: match.moves?.creatorMove || "unknown",
        player2Move: match.moves?.joinerMove || "unknown",
        winner: winner === "tie" || winner === "Tie" ? null : winner,
        gameMode: "multiplayer",
        timestampMs: new Date(match.result?.timestamp || Date.now()).getTime(),
        ipfsHash: match.ipfsHash,
      });

      if (!success) {
        console.warn(`[History Fast] Database storage failed gracefully for match ${match.roomId}`);
        // Still return success since we have Redis cache
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing match history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
