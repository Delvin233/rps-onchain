import { NextRequest, NextResponse } from "next/server";
import { resolvePlayerName } from "~~/lib/nameResolution";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const resolved = await resolvePlayerName(address);

    return NextResponse.json({
      address: resolved.address,
      displayName: resolved.displayName,
      source: resolved.source,
      farcasterUsername: resolved.farcasterUsername,
      farcasterDisplayName: resolved.farcasterDisplayName,
      ensName: resolved.ensName,
      basename: resolved.basename,
      pfpUrl: null, // TODO: Add PFP URL support when available
    });
  } catch (error) {
    console.error("Error resolving name:", error);
    return NextResponse.json({ error: "Failed to resolve name" }, { status: 500 });
  }
}
