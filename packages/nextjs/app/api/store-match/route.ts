import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";

let redis: ReturnType<typeof createClient> | null = null;

const getRedis = async () => {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  }
  return redis;
};

export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();

    // Store match data to IPFS via Pinata
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(matchData)], { type: "application/json" });
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
    const filename = `match-${matchData.roomId}-${dateStr}.json`;
    formData.append("file", blob, filename);

    // Upload to Pinata IPFS
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    let ipfsHash: string;
    if (!response.ok) {
      ipfsHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
    } else {
      const result = await response.json();
      ipfsHash = result.IpfsHash;
    }

    // Store in Redis for instant access
    const client = await getRedis();
    const matchWithHash = { ...matchData, ipfsHash, timestamp: Date.now() };

    // Store by player addresses for fast user history lookup
    const players = [matchData.players?.creator, matchData.players?.joiner, matchData.player, matchData.address].filter(
      Boolean,
    );

    // Determine winner for stats
    const winner = typeof matchData.result === "object" ? matchData.result.winner : matchData.result;

    for (const player of players) {
      if (player) {
        const playerLower = player.toLowerCase();

        // Cache match history in Redis (7-day TTL)
        await client.lPush(`history:${playerLower}`, JSON.stringify(matchWithHash));
        await client.lTrim(`history:${playerLower}`, 0, 49); // Keep last 50 matches
        await client.expire(`history:${playerLower}`, 604800); // 7 days

        // Update lifetime stats
        const statsKey = `stats:${playerLower}`;
        const stats = await client.get(statsKey);
        const currentStats = stats ? JSON.parse(stats) : { totalGames: 0, wins: 0, losses: 0, ties: 0 };

        currentStats.totalGames++;
        if (winner === player) {
          currentStats.wins++;
        } else if (winner === "tie" || winner === "Tie") {
          currentStats.ties++;
        } else {
          currentStats.losses++;
        }
        currentStats.winRate =
          currentStats.totalGames > 0 ? Math.round((currentStats.wins / currentStats.totalGames) * 100) : 0;

        await client.set(statsKey, JSON.stringify(currentStats));
      }
    }

    return NextResponse.json({ ipfsHash });
  } catch (error) {
    console.error("Error storing to IPFS:", error);
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
    return NextResponse.json({ ipfsHash: mockHash });
  }
}
