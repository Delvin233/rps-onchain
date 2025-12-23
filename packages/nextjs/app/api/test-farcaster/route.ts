import { NextRequest, NextResponse } from "next/server";
import { resolvePlayerName } from "~~/lib/nameResolution";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address parameter required" }, { status: 400 });
    }

    console.log(`[Test Farcaster] Testing resolution for address: ${address}`);

    // Test the resolution
    const result = await resolvePlayerName(address);

    console.log(`[Test Farcaster] Resolution result:`, result);

    // Also check environment variables
    const hasNeynarKey = !!process.env.NEYNAR_API_KEY;
    const neynarKeyLength = process.env.NEYNAR_API_KEY?.length || 0;

    return NextResponse.json({
      success: true,
      address,
      result,
      debug: {
        hasNeynarKey,
        neynarKeyLength,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Test Farcaster] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
