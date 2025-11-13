import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function POST(request: NextRequest) {
  try {
    const { roomId, txHash, chainId } = await request.json();

    if (!roomId || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Store blockchain proof
    await redis.set(`blockchain:${roomId}`, JSON.stringify({ txHash, chainId, timestamp: Date.now() }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing blockchain proof:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const proof = await redis.get(`blockchain:${roomId}`);

    if (!proof) {
      return NextResponse.json({ proof: null });
    }

    return NextResponse.json({ proof: typeof proof === "string" ? JSON.parse(proof) : proof });
  } catch (error) {
    console.error("Error fetching blockchain proof:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
