import { NextRequest, NextResponse } from "next/server";
import { roomStorage } from "~~/lib/roomStorage";

export async function POST(req: NextRequest) {
  try {
    const { roomId, player, action } = await req.json();

    const room = roomStorage.get(roomId);
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
      room.playerLeft = player;
      roomStorage.set(roomId, room);

      // Delete room after 3 seconds to allow other player to see notification
      setTimeout(() => {
        roomStorage.delete(roomId);
      }, 3000);

      return NextResponse.json({ success: true });
    }

    roomStorage.set(roomId, room);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling rematch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
