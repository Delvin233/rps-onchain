import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address.toLowerCase()}`,
      { headers: { "x-api-key": process.env.NEYNAR_API_KEY || "" } },
    );

    if (!response.ok) {
      return NextResponse.json({ username: null });
    }

    const data = await response.json();
    const user = data[address.toLowerCase()]?.[0];

    return NextResponse.json({
      username: user?.username || null,
      displayName: user?.display_name || null,
      pfpUrl: user?.pfp_url || null,
    });
  } catch {
    return NextResponse.json({ username: null });
  }
};
