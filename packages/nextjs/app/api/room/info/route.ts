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

    return NextResponse.json({
      betAmount: room.betAmount,
      status: room.status,
      creator: room.creator,
      joiner: room.joiner,
      creatorVerified: room.creatorVerified || false,
      joinerVerified: room.joinerVerified || false,
      isFree: room.isFree || false,
    });
  } catch (error) {
    console.error("Error getting room info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
