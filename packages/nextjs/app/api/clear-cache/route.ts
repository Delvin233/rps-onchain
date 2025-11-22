import { NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function POST() {
  try {
    const keys = await redis.keys("stats:*");

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return NextResponse.json({
      success: true,
      cleared: keys.length,
      message: `Cleared ${keys.length} stats cache entries`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
