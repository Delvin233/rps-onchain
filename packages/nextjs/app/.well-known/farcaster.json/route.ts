import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: process.env.NEXT_PUBLIC_FARCASTER_HEADER || "",
      payload: process.env.NEXT_PUBLIC_FARCASTER_PAYLOAD || "",
      signature: process.env.NEXT_PUBLIC_FARCASTER_SIGNATURE || "",
    },
    frame: {
      version: "1",
      name: "RPS-onChain",
      iconUrl: `${process.env.NEXT_PUBLIC_URL}/rpsOnchainFavicons/android-chrome-512x512.png`,
      homeUrl: process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz",
      imageUrl: `${process.env.NEXT_PUBLIC_URL}/images/frame-preview.png`,
      buttonTitle: "Play RPS",
      splashImageUrl: `${process.env.NEXT_PUBLIC_URL}/images/splash.png`,
      splashBackgroundColor: "#0c0a09",
      webhookUrl: `${process.env.NEXT_PUBLIC_URL}/api/farcaster/webhook`,
    },
  };

  return NextResponse.json(manifest);
}
