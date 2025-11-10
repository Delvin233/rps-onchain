import { NextRequest, NextResponse } from "next/server";
import { roomStorage } from "~~/lib/roomStorage";

function determineWinner(move1: string, move2: string): "win" | "lose" | "tie" {
  if (move1 === move2) return "tie";
  if (
    (move1 === "rock" && move2 === "scissors") ||
    (move1 === "paper" && move2 === "rock") ||
    (move1 === "scissors" && move2 === "paper")
  ) {
    return "win";
  }
  return "lose";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Submit move request:", body);
    const { roomId, player, move, signature, message } = body;

    if (!roomId || !player || !move) {
      console.log("Missing fields:", { roomId: !!roomId, player: !!player, move: !!move });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const room = roomStorage.get(roomId);
    if (!room) {
      console.log("Room not found:", roomId);
      console.log("Available rooms:", Array.from(roomStorage.getAll().keys()));
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    console.log("Room found:", { roomId, status: room.status, creator: room.creator, joiner: room.joiner });

    // Store move and signature
    if (room.creator === player) {
      console.log("Creator submitting move:", move);
      room.creatorMove = move;
      room.creatorSignature = signature;
      room.creatorMessage = message;
    } else if (room.joiner === player) {
      console.log("Joiner submitting move:", move);
      room.joinerMove = move;
      room.joinerSignature = signature;
      room.joinerMessage = message;
    } else {
      console.log("Player not in room:", { player, creator: room.creator, joiner: room.joiner });
      return NextResponse.json({ error: "Player not in room" }, { status: 403 });
    }

    // Check if both players submitted
    if (room.creatorMove && room.joinerMove) {
      room.status = "finished";
      room.creatorResult = determineWinner(room.creatorMove, room.joinerMove);
      room.joinerResult = determineWinner(room.joinerMove, room.creatorMove);

      // Store to IPFS if free mode
      if (room.isFree) {
        const winner = room.creatorResult === "win" ? room.creator : room.joinerResult === "win" ? room.joiner : "tie";
        const winnerAddress = winner === "tie" ? "tie" : winner;

        const matchData = {
          roomId,
          players: { creator: room.creator, joiner: room.joiner },
          moves: { creatorMove: room.creatorMove, joinerMove: room.joinerMove },
          result: { winner: winnerAddress, timestamp: Date.now() },
          betAmount: room.betAmount || "0",
        };

        // Update stats for both players
        await Promise.all([
          (async () => {
            const creatorHashRes = await fetch(`${req.nextUrl.origin}/api/user-matches?address=${room.creator}`);
            const { ipfsHash: creatorCurrentHash } = await creatorHashRes.json();
            await fetch(`${req.nextUrl.origin}/api/user-stats`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: room.creator, currentHash: creatorCurrentHash, newMatch: matchData }),
            });
          })(),
          (async () => {
            const joinerHashRes = await fetch(`${req.nextUrl.origin}/api/user-matches?address=${room.joiner}`);
            const { ipfsHash: joinerCurrentHash } = await joinerHashRes.json();
            await fetch(`${req.nextUrl.origin}/api/user-stats`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: room.joiner, currentHash: joinerCurrentHash, newMatch: matchData }),
            });
          })(),
        ]);
      }
    } else {
      room.status = "playing";
    }

    roomStorage.set(roomId, room);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting move:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
