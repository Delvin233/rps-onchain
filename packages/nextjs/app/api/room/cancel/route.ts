import { NextRequest, NextResponse } from "next/server";
import { roomStorage } from "~~/lib/roomStorage";

export async function POST(req: NextRequest) {
  try {
    const { roomId, creator } = await req.json();

    if (!roomId || !creator) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const room = roomStorage.get(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.creator !== creator) {
      return NextResponse.json({ error: "Only creator can cancel room" }, { status: 403 });
    }

    if (room.joiner) {
      return NextResponse.json({ error: "Cannot cancel - player already joined" }, { status: 400 });
    }

    roomStorage.delete(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
