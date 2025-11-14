import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { updateEdgeConfig } from "~~/lib/edgeConfigClient";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const key = `matches_${address.toLowerCase()}`;
    const ipfsHash = (await get(key)) || null;

    return NextResponse.json({ ipfsHash });
  } catch (error: any) {
    console.error("Error fetching user matches:", error);
    return NextResponse.json({ ipfsHash: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { address, ipfsHash } = await req.json();
    if (!address || !ipfsHash) {
      return NextResponse.json({ error: "Address and ipfsHash required" }, { status: 400 });
    }

    const key = `matches_${address.toLowerCase()}`;
    await updateEdgeConfig(key, ipfsHash);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error storing user match:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
