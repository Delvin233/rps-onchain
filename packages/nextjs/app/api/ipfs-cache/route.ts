import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export const dynamic = "force-dynamic";

// GET - Retrieve from cache
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hash = searchParams.get("hash");

  if (!hash) {
    return NextResponse.json({ error: "Hash required" }, { status: 400 });
  }

  try {
    const cached = await redis.get(`ipfs:${hash}`);
    if (cached) {
      return NextResponse.json({ data: JSON.parse(cached as string) });
    }
    return NextResponse.json({ data: null });
  } catch (error) {
    console.error("Redis cache read error:", error);
    return NextResponse.json({ data: null });
  }
}

// POST - Store in cache
export async function POST(req: NextRequest) {
  try {
    const { hash, data } = await req.json();

    if (!hash || !data) {
      return NextResponse.json({ error: "Hash and data required" }, { status: 400 });
    }

    // Cache for 1 hour
    await redis.setex(`ipfs:${hash}`, 3600, JSON.stringify(data));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Redis cache write error:", error);
    return NextResponse.json({ error: "Cache write failed" }, { status: 500 });
  }
}
