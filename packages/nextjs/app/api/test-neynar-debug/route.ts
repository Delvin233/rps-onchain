import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") || "0x997c71bb2b7d5814c99494d534db264e1702f245";

  const apiKey = process.env.NEYNAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "NEYNAR_API_KEY not configured" }, { status: 500 });
  }

  const lowerAddress = address.toLowerCase();

  // Test the exact URL being called
  const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${lowerAddress}`;

  console.log("[Debug] Testing Neynar API");
  console.log("[Debug] URL:", url);
  console.log("[Debug] Address:", lowerAddress);
  console.log("[Debug] API Key exists:", !!apiKey);
  console.log("[Debug] API Key length:", apiKey.length);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        api_key: apiKey,
      },
    });

    console.log("[Debug] Response status:", response.status);
    console.log("[Debug] Response headers:", Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log("[Debug] Response body:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      url,
      address: lowerAddress,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.error("[Debug] Error:", error);
    return NextResponse.json(
      {
        error: "Request failed",
        message: error instanceof Error ? error.message : "Unknown error",
        url,
        address: lowerAddress,
      },
      { status: 500 },
    );
  }
}
