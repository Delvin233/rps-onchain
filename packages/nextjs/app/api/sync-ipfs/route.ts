import { NextRequest, NextResponse } from "next/server";
import { getMatchHistory, getStats } from "~~/lib/tursoStorage";

export async function POST(request: NextRequest) {
  try {
    const { address, matches: providedMatches } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Get data from Turso (or use provided matches)
    let matches = providedMatches;
    if (!matches) {
      matches = await getMatchHistory(addressLower);
    }

    const stats = await getStats(addressLower);
    if (!stats) {
      return NextResponse.json({ error: "No stats found" }, { status: 404 });
    }

    // Store to IPFS
    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: {
          address,
          matches,
          stats,
          syncedAt: new Date().toISOString(),
        },
        pinataMetadata: {
          name: `user-${address}-${new Date().toISOString().slice(0, 10)}.json`,
        },
      }),
    });

    if (!pinataResponse.ok) {
      throw new Error("Failed to sync to IPFS");
    }

    const { IpfsHash } = await pinataResponse.json();

    return NextResponse.json({ success: true, ipfsHash: IpfsHash });
  } catch (error: any) {
    console.error("Error syncing to IPFS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
