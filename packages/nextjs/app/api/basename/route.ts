import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // Create Base client for Basename resolution
    const baseClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    let basename = null;

    try {
      // Try to resolve Basename on Base network
      basename = await baseClient.getEnsName({
        address: address as `0x${string}`,
      });
    } catch (error) {
      console.log("Basename resolution failed:", error);
    }

    return NextResponse.json({
      address,
      name: basename,
    });
  } catch (error) {
    console.error("Error resolving basename:", error);
    return NextResponse.json({ error: "Failed to resolve basename" }, { status: 500 });
  }
}
