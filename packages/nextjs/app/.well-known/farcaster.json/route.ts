import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: process.env.NEXT_PUBLIC_FARCASTER_HEADER || "",
      payload: process.env.NEXT_PUBLIC_FARCASTER_PAYLOAD || "",
      signature: process.env.NEXT_PUBLIC_FARCASTER_SIGNATURE || "",
    },
    miniapp: {
      version: "1",
      name: "RPS-onChain",
      iconUrl: `${process.env.NEXT_PUBLIC_URL}/rpsOnchainFavicons/android-chrome-512x512.png`,
      homeUrl: process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz",
      splashImageUrl: `${process.env.NEXT_PUBLIC_URL}/images/splash.png`,
      splashBackgroundColor: "#0c0a09",
      webhookUrl: `${process.env.NEXT_PUBLIC_URL}/api/farcaster/webhook`,
      subtitle: "Free-to-play Rock Paper Scissors",
      description:
        "Free-to-play Rock Paper Scissors game with AI and multiplayer modes. Multi-chain support on Celo and Base.",
      screenshotUrls: [`${process.env.NEXT_PUBLIC_URL}/images/frame-preview.png`],
      primaryCategory: "social",
      tags: ["rockpaperscissors", "multiplayer", "blockchain", "free", "pvp"],
      heroImageUrl: `${process.env.NEXT_PUBLIC_URL}/images/frame-preview.png`,
      tagline: "Play instantly",
      ogTitle: "RPS-onChain",
      ogDescription: "Challenge friends in Rock Paper Scissors on-chain",
      ogImageUrl: `${process.env.NEXT_PUBLIC_URL}/images/frame-preview.png`,
      noindex: false,
    },
    baseBuilder: {
      ownerAddress: "0x22f62d3569639f80e71C6Ec5Da60EeE25734a17e",
    },
  };

  return NextResponse.json(manifest);
}
