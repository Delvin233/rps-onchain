import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

async function migrateUser(address: string, origin: string) {
  const addressLower = address.toLowerCase();

  // Check if user already has Redis data with proper AI/multiplayer split
  const existingStats: any = await redis.get(`stats:${addressLower}`);
  if (
    existingStats &&
    existingStats.ai &&
    existingStats.multiplayer &&
    existingStats.ai.totalGames + existingStats.multiplayer.totalGames === existingStats.totalGames
  ) {
    return { message: "User already migrated", stats: existingStats };
  }

  // Get IPFS hash
  const hashResponse = await fetch(`${origin}/api/user-matches?address=${address}`);
  const { ipfsHash } = await hashResponse.json();

  if (!ipfsHash) {
    return { message: "No IPFS data found" };
  }

  // Fetch IPFS data
  const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
  const ipfsData = await ipfsResponse.json();

  if (!ipfsData.matches || !ipfsData.stats) {
    return { message: "Invalid IPFS data" };
  }

  // Migrate stats to Redis
  await redis.set(`stats:${addressLower}`, ipfsData.stats);

  // Migrate matches to Redis
  for (const match of ipfsData.matches.reverse()) {
    await redis.lpush(`history:${addressLower}`, JSON.stringify(match));
  }

  return {
    success: true,
    migrated: {
      stats: ipfsData.stats,
      matches: ipfsData.matches.length,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const result = await migrateUser(address, request.nextUrl.origin);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const result = await migrateUser(address, request.nextUrl.origin);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
