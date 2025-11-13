import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base, mainnet } from "viem/chains";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    // Try Mainnet ENS
    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    try {
      const ensName = await mainnetClient.getEnsName({
        address: address as `0x${string}`,
      });
      if (ensName) {
        return NextResponse.json({ name: ensName, type: "mainnet" });
      }
    } catch {
      // Continue to next check
    }

    // Try Basename
    try {
      const basenameResponse = await fetch(`${request.nextUrl.origin}/api/basename?address=${address}`);
      if (basenameResponse.ok) {
        const basenameData = await basenameResponse.json();
        if (basenameData.basename) {
          return NextResponse.json({ name: basenameData.basename, type: "basename" });
        }
      }
    } catch {
      // Continue to next check
    }

    // Try Base ENS
    const baseClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    try {
      const baseEnsName = await baseClient.getEnsName({
        address: address as `0x${string}`,
      });
      if (baseEnsName) {
        return NextResponse.json({ name: baseEnsName, type: "base" });
      }
    } catch {
      // No name found
    }

    return NextResponse.json({ name: null });
  } catch (error) {
    console.error("Error resolving name:", error);
    return NextResponse.json({ name: null });
  }
}
