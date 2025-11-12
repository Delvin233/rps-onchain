import { NextRequest, NextResponse } from "next/server";
import { roomStorage } from "~~/lib/roomStorage";

export async function POST(req: NextRequest) {
  try {
    const { roomId, joiner, joinerVerified } = await req.json();

    if (!roomId || !joiner) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const room = roomStorage.get(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.joiner) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    room.joiner = joiner;
    room.joinerVerified = joinerVerified || false;
    room.status = "ready";
    roomStorage.set(roomId, room);

    return NextResponse.json({ success: true, betAmount: room.betAmount, isFree: room.isFree || false });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
