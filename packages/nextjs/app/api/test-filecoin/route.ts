import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test match data
    const testMatch = {
      roomId: "TEST123",
      players: {
        creator: "0x1234567890123456789012345678901234567890",
        joiner: "0x0987654321098765432109876543210987654321",
      },
      moves: {
        creatorMove: "rock",
        joinerMove: "paper",
      },
      result: {
        winner: "0x0987654321098765432109876543210987654321",
        timestamp: Date.now(),
      },
      betAmount: "0.01",
    };

    // Test storage
    const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/store-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testMatch),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "IPFS integration test successful",
      ipfsHash: result.ipfsHash,
      provider: result.provider,
      ipfsUrl: `https://ipfs.io/ipfs/${result.ipfsHash}`,
      testData: testMatch,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "IPFS integration test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
