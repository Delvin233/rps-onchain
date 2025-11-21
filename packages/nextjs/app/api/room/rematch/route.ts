import { NextRequest, NextResponse } from "next/server";
import { roomStorage } from "~~/lib/roomStorage";

export async function POST(req: NextRequest) {
  try {
    const { roomId, player, action } = await req.json();

    const room = await roomStorage.get(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (action === "request") {
      room.rematchRequested = player;
    } else if (action === "accept") {
      room.status = "ready";
      room.creatorMove = null;
      room.joinerMove = null;
      room.creatorResult = undefined;
      room.joinerResult = undefined;
      room.rematchRequested = null;
    } else if (action === "leave") {
      // If this is the first player to leave, mark them
      if (!room.playerLeft) {
        room.playerLeft = player;
        await roomStorage.set(roomId, room);
      } else {
        // Both players left, delete the room
        await roomStorage.delete(roomId, room.chainId);
      }
      return NextResponse.json({ success: true });
    }

    await roomStorage.set(roomId, room);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling rematch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
