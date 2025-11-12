import { NextRequest, NextResponse } from "next/server";
import { determineWinner, games } from "~~/lib/gameStorage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const player = searchParams.get("player");

  if (!roomId || !player) {
    return NextResponse.json({ finished: false });
  }

  const game = games.get(roomId);
  if (!game || !game.creatorMove || !game.joinerMove) {
    return NextResponse.json({ finished: false });
  }

  const winner = determineWinner(game.creatorMove, game.joinerMove);
  const isCreator = player === game.creator;
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

  return NextResponse.json({
    finished: true,
    opponentMove: isCreator ? game.joinerMove : game.creatorMove,
    result,
  });
}
