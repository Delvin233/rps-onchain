import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
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

    // Fetch IPFS hash from Edge Config
    const ipfsHash = (await get(`matches_${addressLower}`)) as string | null;

    let ipfsMatches: any[] = [];
    if (ipfsHash) {
      try {
        const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        const ipfsData = await ipfsResponse.json();
        ipfsMatches = ipfsData.matches || [];
      } catch (error) {
        console.error("Error fetching from IPFS:", error);
      }
    }

    // Merge and deduplicate
    const allMatches = [...parsedRedisMatches, ...ipfsMatches];
    const uniqueMatches = Array.from(
      new Map(
        allMatches.map(m => {
          // Create unique key based on match type
          let key: string;
          if (m.opponent === "AI") {
            // AI match: timestamp + player
            key = `ai-${m.timestamp}-${m.player}`;
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
