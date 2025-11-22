import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, getMatchHistory, getStats } from "~~/lib/tursoStorage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { address, matches: providedMatches } = body;

    // Bulk sync all users if no address provided
    if (!address) {
      const allAddresses = await getAllUsers();
      const results = [];

      for (const addr of allAddresses) {
        try {
          const matches = await getMatchHistory(addr);
          const stats = await getStats(addr);

          if (!stats) continue;

          const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.PINATA_JWT}`,
            },
            body: JSON.stringify({
              pinataContent: {
                address: addr,
                matches,
                stats,
                syncedAt: new Date().toISOString(),
              },
              pinataMetadata: {
                name: `user-${addr}-${new Date().toISOString().slice(0, 10)}.json`,
              },
            }),
          });

          if (pinataResponse.ok) {
            const { IpfsHash } = await pinataResponse.json();
            results.push({ address: addr, ipfsHash: IpfsHash });
          }
        } catch (err) {
          console.error(`Failed to sync ${addr}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        synced: results.length,
        total: allAddresses.length,
        results,
      });
    }

    // Single address sync
    const addressLower = address.toLowerCase();

    let matches = providedMatches;
    if (!matches) {
      matches = await getMatchHistory(addressLower);
    }

    const stats = await getStats(addressLower);
    if (!stats) {
      return NextResponse.json({ error: "No stats found" }, { status: 404 });
    }

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
