import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function POST(request: NextRequest) {
  try {
    const { address, match } = await request.json();

    if (!address || !match) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();
    const key = `history:${addressLower}`;

    await redis.lpush(key, JSON.stringify(match));
    await redis.ltrim(key, 0, 99);
    await redis.expire(key, 60 * 60 * 24 * 7);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing match history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
