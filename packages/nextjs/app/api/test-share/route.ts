import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const matchId = searchParams.get("matchId");

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    console.log(`[Test Share] Testing roomId=${roomId}, matchId=${matchId}`);

    // Get all history keys
    const historyKeys = await redis.keys(`history:*`);
    console.log(`[Test Share] Found ${historyKeys.length} history keys:`, historyKeys);

    const allMatches = [];
    for (const key of historyKeys) {
      const history = await redis.lrange(key, 0, -1); // Get all items from the list
      if (history && Array.isArray(history)) {
        for (const matchStr of history) {
          try {
            const match = typeof matchStr === "string" ? JSON.parse(matchStr) : matchStr;
            if (match.roomId === roomId) {
              allMatches.push({
                ...match,
                historyKey: key,
                generatedMatchId:
                  match.moves?.creatorMove && match.moves?.joinerMove
                    ? `${match.moves.creatorMove}_${match.moves.joinerMove}_${match.timestamp}`
                    : "no-moves",
                simpleMatchId:
                  match.moves?.creatorMove && match.moves?.joinerMove
                    ? `${match.moves.creatorMove}_${match.moves.joinerMove}`
                    : "no-moves",
              });
            }
          } catch (parseError) {
            console.error(`[Test Share] Error parsing match:`, parseError);
          }
        }
      }
    }

    console.log(`[Test Share] Found ${allMatches.length} matches for room ${roomId}`);

    return NextResponse.json({
      roomId,
      requestedMatchId: matchId,
      totalHistoryKeys: historyKeys.length,
      matchesFound: allMatches.length,
      matches: allMatches,
      historyKeys: historyKeys,
    });
  } catch (error) {
    console.error("Error in test share:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
