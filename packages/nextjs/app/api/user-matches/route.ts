import { NextRequest, NextResponse } from "next/server";
import { getMatchHistory } from "~~/lib/tursoStorage";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const matches = await getMatchHistory(address.toLowerCase(), 50);
    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error("Error fetching user matches:", error);
    return NextResponse.json({ matches: [] });
  }
}
