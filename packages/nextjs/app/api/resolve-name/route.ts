import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const BASENAME_CONTRACT = "0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a";
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY || "demo";

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

    // Try Farcaster username first (prioritize for Farcaster users)
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

    // Try Basename as fallback
    try {
      const url = `https://base-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_KEY}/getNFTs?owner=${address}&contractAddresses[]=${BASENAME_CONTRACT}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.ownedNfts && data.ownedNfts.length > 0) {
          const basename = data.ownedNfts[0]?.name || data.ownedNfts[0]?.title;
          if (basename) {
            return NextResponse.json({ name: basename, pfp: null });
          }
        }
      }
    } catch {
      // No Basename found
    }

    return NextResponse.json({ name: null, pfp: null });
  } catch (error) {
    console.error("Error resolving name:", error);
    return NextResponse.json({ name: null });
  }
}
