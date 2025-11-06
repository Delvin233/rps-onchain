import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ verified: false });
    }

    const normalizedAddress = address.toLowerCase();
    const verification = await get(`verified_${normalizedAddress}`);

    if (verification) {
      return NextResponse.json(verification);
    }

    return NextResponse.json({ verified: false });
  } catch (error) {
    console.error("Error checking verification:", error);
    return NextResponse.json({ verified: false });
  }
}
