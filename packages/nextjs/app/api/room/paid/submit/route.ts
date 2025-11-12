import { NextRequest, NextResponse } from "next/server";
import { determineWinner, games } from "~~/lib/gameStorage";

export async function POST(req: NextRequest) {
  try {
    const { roomId, player, move } = await req.json();

    let game = games.get(roomId);
    if (!game) {
      game = { creator: player, joiner: "" };
      games.set(roomId, game);
    }

    const isCreator = player === game.creator;
    if (isCreator) {
      game.creatorMove = move;
    } else {
      game.joinerMove = move;
      if (!game.joiner) game.joiner = player;
    }

    if (game.creatorMove && game.joinerMove) {
      const winner = determineWinner(game.creatorMove, game.joinerMove);
      const winnerAddress =
        winner === "tie"
          ? "0x0000000000000000000000000000000000000000"
          : winner === "creator"
            ? game.creator
            : game.joiner;

      console.log(`[SUBMIT] Both moves received for room ${roomId}`);
      console.log(`[SUBMIT] Winner: ${winner}, Address: ${winnerAddress}`);

      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000";

      // Trigger payout (must complete before response)
      try {
        console.log(`[SUBMIT] Calling payout API at ${baseUrl}/api/room/payout`);
        const payoutRes = await fetch(`${baseUrl}/api/room/payout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, winner: winnerAddress }),
        });
        const payoutData = await payoutRes.json();
        console.log(`[SUBMIT] Payout response:`, payoutData);

        // Store match to IPFS for both players
        const matchData = {
          roomId,
          players: { creator: game.creator, joiner: game.joiner },
          moves: { creatorMove: game.creatorMove, joinerMove: game.joinerMove },
          result: { winner: winnerAddress, timestamp: new Date().toISOString() },
          betAmount: "0.01",
          txHash: payoutData.txHash,
        };

        await Promise.all([
          fetch(`${baseUrl}/api/user-matches?address=${game.creator}`)
            .then(res => res.json())
            .then(({ ipfsHash }) =>
              fetch(`${baseUrl}/api/user-stats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: game.creator, currentHash: ipfsHash, newMatch: matchData }),
              }),
            ),
          fetch(`${baseUrl}/api/user-matches?address=${game.joiner}`)
            .then(res => res.json())
            .then(({ ipfsHash }) =>
              fetch(`${baseUrl}/api/user-stats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: game.joiner, currentHash: ipfsHash, newMatch: matchData }),
              }),
            ),
        ]);
        console.log(`[SUBMIT] Match stored to IPFS for both players`);
      } catch (error) {
        console.error("[SUBMIT] Payout error:", error);
      }
    }

    return NextResponse.json({ finished: false });
  } catch (error: any) {
    console.error("Error submitting move:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
