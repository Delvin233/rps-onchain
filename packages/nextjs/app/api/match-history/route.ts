import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    if (!process.env.PINATA_JWT) {
      // Fallback to localStorage only
      return NextResponse.json({ matches: [] });
    }

    // Query Pinata for all matches containing this address
    const response = await fetch(`https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={}`, {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    });

    const data = await response.json();
    const matches: any[] = [];

    // Fetch each match file and check if address is involved
    for (const pin of data.rows) {
      if (pin.metadata.name && (pin.metadata.name.includes("match") || pin.metadata.name.includes("ai-match"))) {
        try {
          const matchResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${pin.ipfs_pin_hash}`);
          const matchData = await matchResponse.json();

          // Check if this address is involved in the match
          const isInvolved =
            matchData.player === address || matchData.creator === address || matchData.joiner === address;

          if (isInvolved) {
            matches.push({
              ...matchData,
              ipfsHash: pin.ipfs_pin_hash,
              filename: pin.metadata.name,
            });
          }
        } catch (error) {
          console.error(`Error fetching match ${pin.ipfs_pin_hash}:`, error);
        }
      }
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching match history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
