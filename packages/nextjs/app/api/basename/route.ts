import { NextRequest, NextResponse } from "next/server";

const BASENAME_CONTRACT = "0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a";
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY || "demo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ name: null });
    }

    const url = `https://base-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_KEY}/getNFTs?owner=${address}&contractAddresses[]=${BASENAME_CONTRACT}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (data.ownedNfts && data.ownedNfts.length > 0) {
        const basename = data.ownedNfts[0]?.name || data.ownedNfts[0]?.title;
        if (basename) {
          return NextResponse.json({ name: basename });
        }
      }
    }

    return NextResponse.json({ name: null });
  } catch {
    return NextResponse.json({ name: null });
  }
}
