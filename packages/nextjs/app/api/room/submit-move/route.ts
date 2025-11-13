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

    const room = await roomStorage.get(roomId);
    if (!room) {
      console.log("Room not found:", roomId);
      const allRooms = await roomStorage.getAll();
      console.log(
        "Available rooms:",
        allRooms.map(r => r.roomId),
      );
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

      // Store to IPFS
      const winner =
        room.creatorResult === "win"
          ? room.creator
          : room.joinerResult === "win"
            ? room.joiner
            : "0x0000000000000000000000000000000000000000";
      const matchData = {
        roomId,
        players: { creator: room.creator, joiner: room.joiner },
        moves: { creatorMove: room.creatorMove, joinerMove: room.joinerMove },
        result: { winner, timestamp: new Date().toISOString() },
      };

      // Store to Redis history for both players
      const storePromises = [];

      // Store for creator
      storePromises.push(
        fetch(`${req.nextUrl.origin}/api/history-fast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: room.creator,
            match: {
              roomId,
              players: { creator: room.creator, joiner: room.joiner },
              moves: { creatorMove: room.creatorMove, joinerMove: room.joinerMove },
              result: { winner, timestamp: new Date().toISOString() },
            },
          }),
        }),
      );

      // Store for joiner
      if (room.joiner) {
        storePromises.push(
          fetch(`${req.nextUrl.origin}/api/history-fast`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: room.joiner,
              match: {
                roomId,
                players: { creator: room.creator, joiner: room.joiner },
                moves: { creatorMove: room.creatorMove, joinerMove: room.joinerMove },
                result: { winner, timestamp: new Date().toISOString() },
              },
            }),
          }),
        );
      }

      await Promise.all(storePromises);

      // Batch IPFS uploads to avoid rate limits
      // Only sync to IPFS every 10 games or at 100 games
      const shouldSyncToIPFS = async (address: string) => {
        try {
          const response = await fetch(`${req.nextUrl.origin}/api/stats-fast?address=${address}`);
          const { stats } = await response.json();
          // Sync on first game, every 10th game, or at 100 games
          return stats.totalGames === 1 || stats.totalGames % 10 === 0 || stats.totalGames >= 100;
        } catch {
          return false;
        }
      };

      const [creatorShouldSync, joinerShouldSync] = await Promise.all([
        shouldSyncToIPFS(room.creator),
        room.joiner ? shouldSyncToIPFS(room.joiner) : Promise.resolve(false),
      ]);

      // Only sync to IPFS if needed (batching)
      const ipfsSyncPromises = [];
      if (creatorShouldSync) {
        ipfsSyncPromises.push(
          (async () => {
            const creatorHashRes = await fetch(`${req.nextUrl.origin}/api/user-matches?address=${room.creator}`);
            const { ipfsHash: creatorCurrentHash } = await creatorHashRes.json();
            await fetch(`${req.nextUrl.origin}/api/user-stats`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: room.creator, currentHash: creatorCurrentHash, newMatch: matchData }),
            });
          })(),
        );
      }
      if (joinerShouldSync && room.joiner) {
        ipfsSyncPromises.push(
          (async () => {
            const joinerHashRes = await fetch(`${req.nextUrl.origin}/api/user-matches?address=${room.joiner}`);
            const { ipfsHash: joinerCurrentHash } = await joinerHashRes.json();
            await fetch(`${req.nextUrl.origin}/api/user-stats`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: room.joiner, currentHash: joinerCurrentHash, newMatch: matchData }),
            });
          })(),
        );
      }

      if (ipfsSyncPromises.length > 0) {
        await Promise.all(ipfsSyncPromises);
      }
    } else {
      room.status = "playing";
    }

    await roomStorage.set(roomId, room);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting move:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
