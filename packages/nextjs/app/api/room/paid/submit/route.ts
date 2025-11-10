import { NextRequest, NextResponse } from "next/server";

const games = new Map<string, { creatorMove?: string; joinerMove?: string; creator: string; joiner: string }>();

function determineWinner(move1: string, move2: string): "creator" | "joiner" | "tie" {
  if (move1 === move2) return "tie";
  if (
    (move1 === "rock" && move2 === "scissors") ||
    (move1 === "paper" && move2 === "rock") ||
    (move1 === "scissors" && move2 === "paper")
  ) {
    return "creator";
  }
  return "joiner";
}

export async function POST(req: NextRequest) {
  try {
    const { roomId, player, move, betAmount } = await req.json();

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

      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000";

      await fetch(`${baseUrl}/api/room/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, winner: winnerAddress }),
      });

      const result = isCreator
        ? winner === "creator"
          ? "win"
          : winner === "tie"
            ? "tie"
            : "lose"
        : winner === "joiner"
          ? "win"
          : winner === "tie"
            ? "tie"
            : "lose";

      const matchData = {
        roomId,
        players: { creator: game.creator, joiner: game.joiner },
        moves: { creatorMove: game.creatorMove, joinerMove: game.joinerMove },
        result: { winner: winnerAddress, timestamp: Date.now() },
        betAmount: betAmount || "0",
      };

      // Update stats for both players
      await Promise.all([
        // Creator stats
        (async () => {
          const creatorHashRes = await fetch(`${baseUrl}/api/user-matches?address=${game.creator}`);
          const { ipfsHash: creatorCurrentHash } = await creatorHashRes.json();
          await fetch(`${baseUrl}/api/user-stats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: game.creator,
              currentHash: creatorCurrentHash,
              newMatch: matchData,
            }),
          });
        })(),
        // Joiner stats
        (async () => {
          const joinerHashRes = await fetch(`${baseUrl}/api/user-matches?address=${game.joiner}`);
          const { ipfsHash: joinerCurrentHash } = await joinerHashRes.json();
          await fetch(`${baseUrl}/api/user-stats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: game.joiner,
              currentHash: joinerCurrentHash,
              newMatch: matchData,
            }),
          });
        })(),
      ]);

      return NextResponse.json({
        finished: true,
        opponentMove: isCreator ? game.joinerMove : game.creatorMove,
        result,
        winner: winnerAddress,
      });
    }

    return NextResponse.json({ finished: false });
  } catch (error: any) {
    console.error("Error submitting move:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
