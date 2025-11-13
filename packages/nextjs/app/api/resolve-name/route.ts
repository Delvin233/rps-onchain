import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base, celo, mainnet } from "viem/chains";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ name: null });
    }

    // Try all chains: Base, Celo, Mainnet
    const chains = [
      { client: createPublicClient({ chain: base, transport: http() }), name: "Base" },
      { client: createPublicClient({ chain: celo, transport: http() }), name: "Celo" },
      { client: createPublicClient({ chain: mainnet, transport: http() }), name: "Mainnet" },
    ];

    for (const { client, name: chainName } of chains) {
      try {
        const resolvedName = await client.getEnsName({
          address: address as `0x${string}`,
        });
        if (resolvedName) {
          return NextResponse.json({ name: resolvedName });
        }
      } catch {
        console.log(`No name found on ${chainName} for`, address);
      }
    }

    return NextResponse.json({ name: null });
  } catch (error) {
    console.error("Error resolving name:", error);
    return NextResponse.json({ name: null });
  }
}
