import { NextRequest, NextResponse } from "next/server";
import { formatBytes } from "~~/lib/migration-utils";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Check if user has migrated data
    const stats = await redis.get(`stats:${addressLower}`);
    const matchCount = await redis.llen(`history:${addressLower}`);

    // Get a sample of recent matches to estimate data size
    const sampleMatches = await redis.lrange(`history:${addressLower}`, 0, 4);
    const sampleSize = sampleMatches.reduce((total, match) => {
      return total + (typeof match === "string" ? match.length : JSON.stringify(match).length);
    }, 0);

    const estimatedTotalSize = sampleMatches.length > 0 ? (sampleSize / sampleMatches.length) * matchCount : 0;

    return NextResponse.json({
      address: addressLower,
      migrated: !!stats,
      stats,
      matchCount,
      estimatedDataSize: formatBytes(estimatedTotalSize),
      sampleSize: sampleMatches.length,
    });
  } catch (error: any) {
    console.error("Migration status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
