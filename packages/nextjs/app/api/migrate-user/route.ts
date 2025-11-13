import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();
    
    // Check if user already has Redis data
    const existingStats = await redis.get(`stats:${addressLower}`);
    if (existingStats) {
      return NextResponse.json({ message: "User already migrated" });
    }
    
    // Get IPFS hash
    const hashResponse = await fetch(`${request.nextUrl.origin}/api/user-matches?address=${address}`);
    const { ipfsHash } = await hashResponse.json();
    
    if (!ipfsHash) {
      return NextResponse.json({ message: "No IPFS data found" });
    }
    
    // Fetch IPFS data
    const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    const ipfsData = await ipfsResponse.json();
    
    if (!ipfsData.matches || !ipfsData.stats) {
      return NextResponse.json({ message: "Invalid IPFS data" });
    }
    
    // Migrate stats to Redis
    await redis.set(`stats:${addressLower}`, ipfsData.stats);
    
    // Migrate matches to Redis
    for (const match of ipfsData.matches.reverse()) { // Reverse to maintain order
      await redis.lpush(`history:${addressLower}`, JSON.stringify(match));
    }
    
    return NextResponse.json({ 
      success: true, 
      migrated: {
        stats: ipfsData.stats,
        matches: ipfsData.matches.length
      }
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}