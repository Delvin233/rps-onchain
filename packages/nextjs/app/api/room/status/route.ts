import { NextRequest, NextResponse } from "next/server";
import { roomStorage } from "~~/lib/roomStorage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const room = await roomStorage.get(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Return status and results if game is finished
    if (room.status === "finished") {
      const response = {
        status: room.status,
        creator: room.creator,
        joiner: room.joiner,
        creatorMove: room.creatorMove,
        joinerMove: room.joinerMove,
        creatorResult: room.creatorResult,
        joinerResult: room.joinerResult,
        rematchRequested: room.rematchRequested,
        playerLeft: room.playerLeft,
        ipfsHash: room.ipfsHash,
        betAmount: room.betAmount,
        roomId: roomId,
        chainId: room.chainId,
        playerNames: room.playerNames,
      };
      console.log("Returning finished game status:", response);
      return NextResponse.json(response);
    }

    return NextResponse.json({
      status: room.status,
      rematchRequested: room.rematchRequested,
      playerLeft: room.playerLeft,
    });
  } catch (error) {
    console.error("Error getting room status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
