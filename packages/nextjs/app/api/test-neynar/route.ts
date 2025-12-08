import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to debug Neynar API response
 * GET /api/test-neynar?address=0x...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const apiKey = process.env.NEYNAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "NEYNAR_API_KEY not configured" }, { status: 500 });
  }

  try {
    const lowerAddress = address.toLowerCase();
    const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${lowerAddress}`;
    console.log("[Test Neynar] Fetching:", url);

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        api_key: apiKey,
      },
    });

    console.log("[Test Neynar] Status:", response.status);

    const data = await response.json();
    console.log("[Test Neynar] Response:", JSON.stringify(data, null, 2));

    // Try both lowercase and original address
    const users = data[lowerAddress] || data[address];

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data,
      parsed: {
        hasData: !!data,
        hasLowerAddress: !!data[lowerAddress],
        hasOriginalAddress: !!data[address],
        addressData: users,
        username: users?.[0]?.username,
        allKeys: Object.keys(data),
      },
    });
  } catch (error) {
    console.error("[Test Neynar] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
