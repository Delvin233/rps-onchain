import MatchShareClient from "./MatchShareClient";
import { Metadata } from "next";

// Generate metadata for social sharing
export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string; matchId: string }>;
}): Promise<Metadata> {
  const { roomId, matchId } = await params;

  try {
    console.log(`[Share Metadata] Generating metadata for roomId=${roomId}, matchId=${matchId}`);

    // Get base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz";
    const apiUrl = `${baseUrl}/api/share/${roomId}?matchId=${matchId}`;

    console.log(`[Share Metadata] Fetching from: ${apiUrl}`);

    // Fetch match data for metadata
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    console.log(`[Share Metadata] Fetch response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.warn(`[Share Metadata] API response not ok: ${response.status}`);
      return {
        title: "RPS Match - RPS-onChain",
        description: "Rock Paper Scissors match result",
      };
    }

    const matchData = await response.json();
    console.log(`[Share Metadata] Match data received for roomId=${roomId}`);

    const creatorName =
      matchData.playerNames?.creator ||
      `${matchData.players.creator.slice(0, 6)}...${matchData.players.creator.slice(-4)}`;
    const joinerName =
      matchData.playerNames?.joiner ||
      `${matchData.players.joiner.slice(0, 6)}...${matchData.players.joiner.slice(-4)}`;

    const winner = matchData.result.winner;
    const winnerName = winner === "tie" ? "Tie" : winner === matchData.players.creator ? creatorName : joinerName;

    const title =
      winner === "tie"
        ? `${creatorName} vs ${joinerName} - Tie Game!`
        : `${winnerName} beats ${winner === matchData.players.creator ? joinerName : creatorName}!`;

    const description = `${matchData.moves.creatorMove} vs ${matchData.moves.joinerMove} - ${
      winner === "tie" ? "Epic tie game" : `${winnerName} wins`
    }! Challenge them to a rematch.`;

    console.log(`[Share Metadata] Generated title: ${title}`);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [`${baseUrl}/api/og/match/${roomId}/${matchId}`],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [`${baseUrl}/api/og/match/${roomId}/${matchId}`],
      },
      other: {
        "fc:miniapp": JSON.stringify({
          version: "1",
          imageUrl: `${baseUrl}/api/og/match/${roomId}/${matchId}`,
          button: {
            title: winner === "tie" ? "Play Again" : `Challenge ${winnerName}`,
            action: {
              type: "launch_miniapp",
              name: "RPS-onChain",
              url: `${baseUrl}/play/multiplayer`,
              splashImageUrl: `${baseUrl}/icon-512x512.png`,
              splashBackgroundColor: "#0a0a0a",
            },
          },
        }),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);

    // Provide more specific error information
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error(`[Share Metadata] Request timed out for roomId=${roomId}, matchId=${matchId}`);
      } else if (error.message.includes("ETIMEDOUT")) {
        console.error(`[Share Metadata] Network timeout for roomId=${roomId}, matchId=${matchId}`);
      }
    }

    return {
      title: "RPS Match - RPS-onChain",
      description: "Rock Paper Scissors match result",
    };
  }
}

export default async function MatchSharePage({ params }: { params: Promise<{ roomId: string; matchId: string }> }) {
  const { roomId, matchId } = await params;
  return <MatchShareClient roomId={roomId} matchId={matchId} />;
}
