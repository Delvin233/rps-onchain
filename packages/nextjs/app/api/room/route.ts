import { NextResponse } from "next/server";
import {
  createRoom,
  endMatch,
  getRoom,
  joinRoom,
  leaveRoom,
  makeMove,
  requestPlayAgain,
  resetGame,
} from "../../../lib/roomStore";
import { getUsername } from "../../../lib/userStore";

export async function POST(request: Request) {
  const { action, roomId, address, move, username: providedUsername } = await request.json();

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const username = providedUsername || getUsername(address) || "User";
  console.log(`[${action}] Username for ${address}: ${username} (provided: ${providedUsername})`);

  if (action === "create") {
    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const room = createRoom(roomId, address, username);
    console.log(`[CREATE] Room created successfully:`, room);
    return NextResponse.json({ room });
  }

  if (action === "join") {
    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const room = joinRoom(roomId, address, username);
    if (!room) {
      return NextResponse.json({ error: "Room not found or full" }, { status: 404 });
    }

    return NextResponse.json({ room });
  }

  if (action === "move") {
    if (!roomId || !move) {
      return NextResponse.json({ error: "Room ID and move required" }, { status: 400 });
    }

    const room = makeMove(roomId, address, move);
    if (!room) {
      return NextResponse.json({ error: "Invalid move" }, { status: 400 });
    }

    return NextResponse.json({ room });
  }

  if (action === "reset") {
    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const room = resetGame(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ room });
  }

  if (action === "end") {
    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const room = endMatch(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ room });
  }

  if (action === "request") {
    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const room = requestPlayAgain(roomId, address);
    if (!room) {
      return NextResponse.json({ error: "Cannot request play again" }, { status: 400 });
    }

    return NextResponse.json({ room });
  }

  if (action === "leave") {
    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const room = leaveRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ room });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "Room ID required" }, { status: 400 });
  }

  const room = getRoom(roomId);
  console.log(`[GET] Requested room ${roomId}, found:`, room ? "YES" : "NO");
  return NextResponse.json({ room });
}
