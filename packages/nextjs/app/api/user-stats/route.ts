import { NextRequest, NextResponse } from "next/server";
import { getMatchRecord } from "~~/lib/pinataStorage";

export async function POST(req: NextRequest) {
  try {
    const { address, newMatch, currentHash } = await req.json();
    if (!address || !newMatch) {
      return NextResponse.json({ error: "Address and newMatch required" }, { status: 400 });
    }

    let allMatches: any[] = [];

    // Fetch existing matches from IPFS if hash exists
    if (currentHash) {
      const existingData = await getMatchRecord(currentHash);
      if (existingData && existingData.matches) {
        allMatches = existingData.matches;
      }
    }

    // Add new match
    allMatches.unshift(newMatch);

    // Deduplicate matches before storing
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

    // Keep only last 100 matches after deduplication
    const limitedMatches = Array.from(uniqueMatches).slice(0, 100);

    // Calculate stats - separate AI and multiplayer
    const userMatches = limitedMatches.filter(
      (match: any) =>
        match.players?.creator === address || match.players?.joiner === address || match.player === address,
    );

    const aiMatches = userMatches.filter((m: any) => m.opponent === "AI");
    const multiplayerMatches = userMatches.filter((m: any) => m.opponent !== "AI");

    // AI stats
    const aiWins = aiMatches.filter((m: any) => m.result === "win").length;
    const aiTies = aiMatches.filter((m: any) => m.result === "tie").length;
    const aiLosses = aiMatches.length - aiWins - aiTies;
    const aiWinRate = aiMatches.length > 0 ? Math.round((aiWins / aiMatches.length) * 100) : 0;

    // Multiplayer stats
    const multiWins = multiplayerMatches.filter((m: any) =>
      typeof m.result === "object" ? m.result.winner === address : m.result === "win",
    ).length;
    const multiTies = multiplayerMatches.filter((m: any) =>
      typeof m.result === "object" ? m.result.winner === "tie" : m.result === "tie",
    ).length;
    const multiLosses = multiplayerMatches.length - multiWins - multiTies;
    const multiWinRate = multiplayerMatches.length > 0 ? Math.round((multiWins / multiplayerMatches.length) * 100) : 0;

    // Combined stats
    const wins = aiWins + multiWins;
    const ties = aiTies + multiTies;
    const losses = aiLosses + multiLosses;
    const winRate = userMatches.length > 0 ? Math.round((wins / userMatches.length) * 100) : 0;

    // Store updated data to IPFS directly via Pinata
    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: {
          address,
          matches: limitedMatches,
          stats: {
            totalGames: userMatches.length,
            wins,
            losses,
            ties,
            winRate,
            ai: {
              totalGames: aiMatches.length,
              wins: aiWins,
              losses: aiLosses,
              ties: aiTies,
              winRate: aiWinRate,
            },
            multiplayer: {
              totalGames: multiplayerMatches.length,
              wins: multiWins,
              losses: multiLosses,
              ties: multiTies,
              winRate: multiWinRate,
            },
          },
          updatedAt: new Date().toISOString(),
        },
        pinataMetadata: {
          name: `user-${address}-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)}.json`,
        },
      }),
    });

    if (!pinataResponse.ok) {
      throw new Error("Failed to store to IPFS");
    }

    const pinataData = await pinataResponse.json();
    const ipfsHash = pinataData.IpfsHash;

    // Unpin old IPFS file if it exists
    if (currentHash) {
      try {
        await fetch(`https://api.pinata.cloud/pinning/unpin/${currentHash}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
        });
      } catch (error) {
        console.error("Error unpinning old file:", error);
      }
    }

    // Update Edge Config with new hash
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000";
    await fetch(`${baseUrl}/api/user-matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, ipfsHash }),
    });

    return NextResponse.json({ success: true, ipfsHash });
  } catch (error: any) {
    console.error("Error updating user stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
