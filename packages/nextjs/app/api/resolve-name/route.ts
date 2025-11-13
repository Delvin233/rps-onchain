import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base, mainnet } from "viem/chains";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ name: null });
    }

    // Try Basename first (Base L2)
    const baseClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    try {
      const basename = await baseClient.getEnsName({
        address: address as `0x${string}`,
      });
      if (basename) {
        return NextResponse.json({ name: basename });
      }
    } catch {
      console.log("No basename found for", address);
    }

    // Try ENS (Mainnet)
    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    try {
      const ensName = await mainnetClient.getEnsName({
        address: address as `0x${string}`,
      });
      if (ensName) {
        return NextResponse.json({ name: ensName });
      }
    } catch {
      console.log("No ENS found for", address);
    }

    return NextResponse.json({ name: null });
  } catch (error) {
    console.error("Error resolving name:", error);
    return NextResponse.json({ name: null });
  }
}
