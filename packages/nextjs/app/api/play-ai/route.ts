import { NextRequest, NextResponse } from "next/server";

type Move = "rock" | "paper" | "scissors";

const moves: Move[] = ["rock", "paper", "scissors"];

const getRandomMove = (): Move => {
  return moves[Math.floor(Math.random() * moves.length)];
};

const determineWinner = (player: Move, ai: Move): "win" | "lose" | "tie" => {
  if (player === ai) return "tie";
  if (
    (player === "rock" && ai === "scissors") ||
    (player === "paper" && ai === "rock") ||
    (player === "scissors" && ai === "paper")
  ) {
    return "win";
  }
  return "lose";
};

export async function POST(req: NextRequest) {
  try {
    const { playerMove, address } = await req.json();

    if (!playerMove || !["rock", "paper", "scissors"].includes(playerMove)) {
      return NextResponse.json({ error: "Invalid move" }, { status: 400 });
    }

    const aiMove = getRandomMove();
    const result = determineWinner(playerMove, aiMove);

    // Get current hash and update stats
    const hashResponse = await fetch(`${req.nextUrl.origin}/api/user-matches?address=${address}`);
    const { ipfsHash: currentHash } = await hashResponse.json();

    await fetch(`${req.nextUrl.origin}/api/user-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        currentHash,
        newMatch: {
          player: address,
          opponent: "AI",
          playerMove,
          opponentMove: aiMove,
          result,
          timestamp: Date.now(),
          betAmount: "0",
        },
      }),
    });

    return NextResponse.json({ aiMove, result });
  } catch (error) {
    console.error("Error in play-ai:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
