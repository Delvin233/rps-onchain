import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();

    // Store to IPFS via Pinata
    if (process.env.PINATA_JWT) {
      const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: matchData,
          pinataMetadata: {
            name: `single-match-${matchData.player}-${Date.now()}.json`,
          },
        }),
      });

      const pinataData = await pinataResponse.json();

      return NextResponse.json({
        success: true,
        ipfsHash: pinataData.IpfsHash,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing single match:", error);
    return NextResponse.json({ success: false, error: "Failed to store match" }, { status: 500 });
  }
}
