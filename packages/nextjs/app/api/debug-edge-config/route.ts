import { NextRequest, NextResponse } from "next/server";
import { get, getAll } from "@vercel/edge-config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const secret = searchParams.get("secret");

  // Always require admin secret (except local dev)
  if (process.env.NODE_ENV !== "development" && secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (address) {
      const normalizedAddress = address.toLowerCase();
      const data = await get(`verified:${normalizedAddress}`);
      return NextResponse.json({
        key: `verified:${normalizedAddress}`,
        data,
        found: !!data,
      });
    }

    const allData = await getAll();
    return NextResponse.json({
      allKeys: Object.keys(allData),
      count: Object.keys(allData).length,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      configured: !!process.env.EDGE_CONFIG,
    });
  }
}
