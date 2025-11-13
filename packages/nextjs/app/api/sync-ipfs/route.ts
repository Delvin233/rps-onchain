import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();
    
    // Get data from Redis
    const [statsData, matches] = await Promise.all([
      redis.get(`stats:${addressLower}`),
      redis.lrange(`history:${addressLower}`, 0, 99)
    ]);
    
    const stats = statsData ? statsData : null;
    if (!stats) {
      return NextResponse.json({ error: "No stats found" }, { status: 404 });
    }
    
    // Get current IPFS hash
    const hashResponse = await fetch(`${request.nextUrl.origin}/api/user-matches?address=${address}`);
    const { ipfsHash: currentHash } = await hashResponse.json();
    
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
          matches: matches.map(m => JSON.parse(m)),
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
    
    // Update Edge Config with new hash
    await fetch(`${request.nextUrl.origin}/api/user-matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, ipfsHash: IpfsHash }),
    });
    
    // Unpin old file
    if (currentHash) {
      try {
        await fetch(`https://api.pinata.cloud/pinning/unpin/${currentHash}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
        });
      } catch (error) {
        console.error("Error unpinning old file:", error);
      }
    }
    
    return NextResponse.json({ success: true, ipfsHash: IpfsHash });
  } catch (error: any) {
    console.error("Error syncing to IPFS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}