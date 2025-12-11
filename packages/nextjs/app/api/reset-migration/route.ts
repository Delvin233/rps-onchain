import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Remove migrated data
    const pipeline = redis.pipeline();
    pipeline.del(`stats:${addressLower}`);
    pipeline.del(`history:${addressLower}`);

    const results = await pipeline.exec();

    return NextResponse.json({
      success: true,
      message: `Migration data cleared for ${addressLower}`,
      deletedKeys: results.filter((result: any) => result[1] > 0).length,
    });
  } catch (error: any) {
    console.error("Reset migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
