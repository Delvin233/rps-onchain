import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();

    if (process.env.PINATA_JWT) {
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().slice(0, 19).replace("T", "-").replace(/:/g, "-");

      const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: matchData,
          pinataMetadata: {
            name: `${matchData.isFree ? "free" : "paid"}-match-${matchData.roomId}-${dateStr}.json`,
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
    console.error("Error storing multiplayer match:", error);
    return NextResponse.json({ success: false, error: "Failed to store match" }, { status: 500 });
  }
}
