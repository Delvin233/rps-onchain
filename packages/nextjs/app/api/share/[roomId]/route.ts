import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");
    const { roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    // If matchId is provided, return specific match data
    if (matchId) {
      return await getMatchData(roomId, matchId);
    }

    // Otherwise return room data
    return await getRoomData(roomId);
  } catch (error) {
    console.error("Error in share API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getMatchData(roomId: string, matchId: string) {
  try {
    console.log(`[Share API] Looking for match: roomId=${roomId}, matchId=${matchId}`);

    // Try to get match from Redis history first
    const historyKeys = await redis.keys(`history:*`);
    console.log(`[Share API] Found ${historyKeys.length} history keys`);

    for (const key of historyKeys) {
      const history = await redis.lrange(key, 0, -1); // Get all items from the list
      if (history && Array.isArray(history)) {
        for (const matchStr of history) {
          try {
            const match = typeof matchStr === "string" ? JSON.parse(matchStr) : matchStr;
            if (match.roomId === roomId) {
              // Generate a match identifier from the match data
              const generatedMatchId = `${match.moves?.creatorMove}_${match.moves?.joinerMove}_${match.timestamp}`;
              const simpleMatchId = `${match.moves?.creatorMove}_${match.moves?.joinerMove}`;

              console.log(
                `[Share API] Checking match: generatedMatchId=${generatedMatchId}, simpleMatchId=${simpleMatchId}, requestedMatchId=${matchId}`,
              );

              // Check if this matches the requested matchId (with or without timestamp)
              if (matchId.includes(simpleMatchId) || generatedMatchId === matchId || simpleMatchId === matchId) {
                console.log(`[Share API] Match found!`);

                // Get player names from display names or use addresses
                const playerNames = await getPlayerNames(match.players?.creator, match.players?.joiner);

                return NextResponse.json({
                  roomId,
                  matchId,
                  players: {
                    creator: match.players?.creator || match.player,
                    joiner: match.players?.joiner || match.opponent,
                  },
                  moves: {
                    creatorMove: match.moves?.creatorMove || match.playerMove,
                    joinerMove: match.moves?.joinerMove || match.opponentMove,
                  },
                  result: {
                    winner: match.result?.winner || (match.result === "win" ? match.player : match.opponent),
                    timestamp: match.timestamp || match.result?.timestamp || Date.now(),
                  },
                  playerNames,
                  ipfsHash: match.ipfsHash,
                });
              }
            }
          } catch (parseError) {
            console.error(`[Share API] Error parsing match data:`, parseError);
            continue;
          }
        }
      }
    }

    console.log(`[Share API] Match not found in Redis history`);
    // If not found in Redis, try localStorage format (fallback)
    // This would require the client to have stored it, so it's less reliable for sharing
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  } catch (error) {
    console.error("Error getting match data:", error);
    return NextResponse.json({ error: "Failed to retrieve match data" }, { status: 500 });
  }
}

async function getRoomData(roomId: string) {
  try {
    // Get room info from Redis
    const roomData = (await redis.get(`room:${roomId}`)) as any;

    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get match history for this room
    const historyKeys = await redis.keys(`history:*`);
    const matches = [];

    for (const key of historyKeys) {
      const history = await redis.lrange(key, 0, -1); // Get all items from the list
      if (history && Array.isArray(history)) {
        for (const matchStr of history) {
          try {
            const match = typeof matchStr === "string" ? JSON.parse(matchStr) : matchStr;
            if (match.roomId === roomId) {
              matches.push(match);
            }
          } catch (parseError) {
            console.error(`[Share API] Error parsing room match:`, parseError);
          }
        }
      }
    }

    // Get player names
    const playerNames = await getPlayerNames(roomData.creator, roomData.joiner);

    return NextResponse.json({
      roomId,
      status: roomData.status || "unknown",
      players: {
        creator: roomData.creator,
        joiner: roomData.joiner,
      },
      playerNames,
      betAmount: roomData.betAmount || "0",
      isFree: roomData.isFree || false,
      totalMatches: matches.length,
      matches: matches.slice(-10), // Return last 10 matches
      canJoin: roomData.status === "waiting" || roomData.status === "ready",
    });
  } catch (error) {
    console.error("Error getting room data:", error);
    return NextResponse.json({ error: "Failed to retrieve room data" }, { status: 500 });
  }
}

async function getPlayerNames(creatorAddress?: string, joinerAddress?: string) {
  const playerNames: { creator?: string; joiner?: string } = {};

  try {
    // Try to get display names from Redis cache
    if (creatorAddress) {
      const creatorName = await redis.get(`displayName:${creatorAddress.toLowerCase()}`);
      if (creatorName && typeof creatorName === "string") {
        playerNames.creator = creatorName;
      }
    }

    if (joinerAddress) {
      const joinerName = await redis.get(`displayName:${joinerAddress.toLowerCase()}`);
      if (joinerName && typeof joinerName === "string") {
        playerNames.joiner = joinerName;
      }
    }
  } catch (error) {
    console.error("Error getting player names:", error);
  }

  return playerNames;
}
