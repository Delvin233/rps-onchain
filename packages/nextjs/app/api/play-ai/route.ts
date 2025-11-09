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

    const storeResponse = await fetch(`${req.nextUrl.origin}/api/store-single-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player: address,
        playerMove,
        aiMove,
        result,
        timestamp: Date.now(),
      }),
    });

    const storeData = await storeResponse.json();

    return NextResponse.json({ aiMove, result, ipfsHash: storeData.ipfsHash });
  } catch (error) {
    console.error("Error in play-ai:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
