import MatchShareClient from "./MatchShareClient";
import { Metadata } from "next";

// Generate metadata for social sharing
export async function generateMetadata({ params }: { params: { roomId: string; matchId: string } }): Promise<Metadata> {
  const { roomId, matchId } = params;

  try {
    // Get base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz";

    // Fetch match data for metadata
    const response = await fetch(`${baseUrl}/api/share/${roomId}?matchId=${matchId}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return {
        title: "RPS Match - RPS-onChain",
        description: "Rock Paper Scissors match result",
      };
    }

    const matchData = await response.json();

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
    return {
      title: "RPS Match - RPS-onChain",
      description: "Rock Paper Scissors match result",
    };
  }
}

export default function MatchSharePage({ params }: { params: { roomId: string; matchId: string } }) {
  return <MatchShareClient roomId={params.roomId} matchId={params.matchId} />;
}
