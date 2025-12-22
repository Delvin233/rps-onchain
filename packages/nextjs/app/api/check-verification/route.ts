import { NextRequest, NextResponse } from "next/server";
import { checkVerificationStatus } from "~~/lib/verification";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
    }

    const result = await checkVerificationStatus(address);

    return NextResponse.json({
      verified: result.verified,
      source: result.source,
      error: result.error,
    });
  } catch (error) {
    console.error("Error checking verification:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        verified: false,
        source: "none",
      },
      { status: 500 },
    );
  }
}
