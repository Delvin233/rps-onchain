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

    // Keep only last 100 matches
    const limitedMatches = allMatches.slice(0, 100);

    // Calculate stats
    const userMatches = limitedMatches.filter(
      (match: any) =>
        match.players?.creator === address || match.players?.joiner === address || match.player === address,
    );

    const wins = userMatches.filter((match: any) =>
      typeof match.result === "object" ? match.result.winner === address : match.result === "win",
    ).length;
    const ties = userMatches.filter((match: any) =>
      typeof match.result === "object" ? match.result.winner === "tie" : match.result === "tie",
    ).length;
    const losses = userMatches.length - wins - ties;
    const winRate = userMatches.length > 0 ? Math.round((wins / userMatches.length) * 100) : 0;
    const totalWagered = userMatches.reduce((sum: number, match: any) => sum + parseFloat(match.betAmount || "0"), 0);

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
            totalWagered,
          },
          updatedAt: Date.now(),
        },
        pinataMetadata: {
          name: `user-stats-${address}-${Date.now()}.json`,
        },
      }),
    });

    if (!pinataResponse.ok) {
      throw new Error("Failed to store to IPFS");
    }

    const pinataData = await pinataResponse.json();
    const ipfsHash = pinataData.IpfsHash;

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
