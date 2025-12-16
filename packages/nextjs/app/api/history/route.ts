import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { getMatchHistory } from "~~/lib/tursoStorage";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Fetch from Redis (fast, last 100 matches)
    const redisMatches = await redis.lrange(`history:${addressLower}`, 0, 99);
    const parsedRedisMatches = redisMatches.map((m: any) => (typeof m === "string" ? JSON.parse(m) : m));

    // Fetch from Turso (persistent database)
    let tursoMatches: any[] = [];
    try {
      const tursoRows = await getMatchHistory(addressLower, 200);

      tursoMatches = tursoRows.map((row: any) => ({
        roomId: row.room_id,
        players: {
          creator: row.player1,
          joiner: row.player2,
        },
        moves: {
          creatorMove: row.player1_move,
          joinerMove: row.player2_move,
        },
        result: {
          winner: row.winner || "tie",
          timestamp: row.timestamp_ms,
        },
        timestamp: row.timestamp_ms,
        ipfsHash: row.ipfs_hash,
        opponent: row.player2 === addressLower ? row.player1 : row.player2,
      }));
    } catch (error) {
      console.error("Error fetching from Turso:", error);
    }

    // Fetch IPFS hash from Edge Config
    const ipfsHash = (await get(`matches_${addressLower}`)) as string | null;

    let ipfsMatches: any[] = [];
    if (ipfsHash) {
      try {
        const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        if (ipfsResponse.ok) {
          const contentType = ipfsResponse.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const ipfsData = await ipfsResponse.json();
            ipfsMatches = ipfsData.matches || [];
          }
        }
      } catch (error) {
        console.error("Error fetching from IPFS:", error);
      }
    }

    // Merge and deduplicate
    const allMatches = [...parsedRedisMatches, ...tursoMatches, ...ipfsMatches];
    const uniqueMatches = Array.from(
      new Map(
        allMatches.map(m => {
          // Create unique key based on match type
          let key: string;
          if (m.opponent === "AI") {
            // AI match: timestamp + player + moves (if available)
            key = `ai-${m.timestamp}-${m.player}-${m.playerMove || "none"}-${m.opponentMove || "none"}`;
          } else if (m.roomId && m.games) {
            // Multiplayer with games array
            key = `room-${m.roomId}-${m.games.length}`;
          } else {
            // Single multiplayer game
            const ts = typeof m.result === "object" ? m.result.timestamp : m.timestamp || Date.now();
            const moves = m.moves ? `${m.moves.creatorMove}-${m.moves.joinerMove}` : "";
            key = `match-${m.roomId}-${ts}-${moves}`;
          }
          return [key, m];
        }),
      ).values(),
    );

    // Sort by timestamp (newest first)
    uniqueMatches.sort((a, b) => {
      const timeA = typeof a.result === "object" ? a.result.timestamp : a.timestamp || a.games?.[0]?.timestamp || 0;
      const timeB = typeof b.result === "object" ? b.result.timestamp : b.timestamp || b.games?.[0]?.timestamp || 0;
      return timeB - timeA;
    });

    return NextResponse.json({ matches: uniqueMatches });
  } catch (error: any) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
