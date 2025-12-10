import { NextRequest, NextResponse } from "next/server";
import { resilientSaveMatch } from "~~/lib/resilient-database";

export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();

    // Upload to Pinata IPFS (backup)
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(matchData)], { type: "application/json" });
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
    const filename = `match-${matchData.roomId}-${dateStr}.json`;
    formData.append("file", blob, filename);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    let ipfsHash: string | undefined;
    if (response.ok) {
      const result = await response.json();
      ipfsHash = result.IpfsHash;
    }

    // Store in database using resilient operations
    const players = [matchData.players?.creator, matchData.players?.joiner, matchData.player, matchData.address].filter(
      Boolean,
    );
    const winner = typeof matchData.result === "object" ? matchData.result.winner : matchData.result;

    if (players.length >= 2) {
      const success = await resilientSaveMatch({
        roomId: matchData.roomId,
        player1: players[0],
        player2: players[1],
        player1Move: matchData.moves?.creatorMove || matchData.playerMove || "unknown",
        player2Move: matchData.moves?.joinerMove || matchData.opponentMove || "unknown",
        winner: winner === "tie" || winner === "Tie" ? null : winner,
        gameMode: matchData.opponent === "AI" ? "ai" : "multiplayer",
        timestampMs: matchData.timestamp || Date.now(),
        ipfsHash,
      });

      if (!success) {
        console.warn(`[Store Match] Database storage failed gracefully for match ${matchData.roomId}`);
        // Still return success since we have IPFS backup
      }
    }

    return NextResponse.json({ ipfsHash: ipfsHash || "stored" });
  } catch (error) {
    console.error("Error storing match:", error);
    return NextResponse.json({ ipfsHash: "error" }, { status: 500 });
  }
}
