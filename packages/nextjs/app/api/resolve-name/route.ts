import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ name: null });
    }

    // Try Mainnet ENS first
    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    try {
      const ensName = await mainnetClient.getEnsName({
        address: address as `0x${string}`,
      });
      if (ensName) {
        return NextResponse.json({ name: ensName, pfp: null });
      }
    } catch {
      // No ENS found
    }

    // Try Farcaster username
    try {
      const fcResponse = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address.toLowerCase()}`,
        { headers: { "x-api-key": process.env.NEYNAR_API_KEY || "" } },
      );
      if (fcResponse.ok) {
        const fcData = await fcResponse.json();
        const user = fcData[address.toLowerCase()]?.[0];
        if (user?.username) {
          return NextResponse.json({ name: user.username, pfp: user.pfp_url });
        }
      }
    } catch {
      // No Farcaster found
    }

    return NextResponse.json({ name: null, pfp: null });
  } catch (error) {
    console.error("Error resolving name:", error);
    return NextResponse.json({ name: null });
  }
}
