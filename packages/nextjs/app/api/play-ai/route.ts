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

    // Update stats in Redis (fast)
    await fetch(`${req.nextUrl.origin}/api/stats-fast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        result,
        isAI: true,
      }),
    });

    return NextResponse.json({ aiMove, result });
  } catch (error) {
    console.error("Error in play-ai:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
