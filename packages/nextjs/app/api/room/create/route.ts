import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "~~/lib/rate-limiter";
import { roomStorage } from "~~/lib/roomStorage";
import { parseChainId } from "~~/utils/chainUtils";

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  return withRateLimit(req, "rooms", async () => {
    try {
      const { creator, betAmount, isFree, chainId, creatorPlatform } = await req.json();

      if (!creator || !chainId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const roomId = generateRoomId();
      // Parse chainId to ensure it's numeric (handles CAIP format like "eip155:8453")
      const numericChainId = parseChainId(chainId);
      console.log("Room creation - parsed chainId:", { original: chainId, parsed: numericChainId });

      await roomStorage.set(roomId, {
        roomId,
        chainId: numericChainId,
        creator: creator.toLowerCase(), // Normalize to lowercase
        creatorPlatform: creatorPlatform || null,
        betAmount: betAmount || "0",
        joiner: null,
        joinerPlatform: null,
        creatorMove: null,
        joinerMove: null,
        status: "waiting",
        isFree: isFree || false,
        createdAt: Date.now(),
      } as any);

      return NextResponse.json({ roomId, chainId: numericChainId });
    } catch (error) {
      console.error("Error creating room:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
