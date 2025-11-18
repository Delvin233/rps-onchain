import { NextRequest, NextResponse } from "next/server";
import { fetchFarcasterUser } from "~~/lib/neynar";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    const user = await fetchFarcasterUser(fid, process.env.NEYNAR_API_KEY || "");
    return NextResponse.json(user);
  } catch {
    // Don't log error for non-Farcaster users (common in Base app)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
};
