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
