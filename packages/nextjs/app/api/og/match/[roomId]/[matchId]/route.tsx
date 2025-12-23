import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string; matchId: string }> }) {
  try {
    const { roomId, matchId } = await params;

    // Fetch match data
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz";
    const matchResponse = await fetch(`${baseUrl}/api/share/${roomId}?matchId=${matchId}`);

    if (!matchResponse.ok) {
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#1a1a1a",
              color: "white",
            }}
          >
            <div style={{ fontSize: 60, fontWeight: "bold" }}>Match Not Found</div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    const matchData = await matchResponse.json();

    const getMoveIcon = (move: string) => {
      const iconSize = 120;
      const color = "#ffffff";

      switch (move.toLowerCase()) {
        case "rock":
          return (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={color}>
              <path d="M18.5 14.7c0 .8-.7 1.5-1.5 1.5H7c-.8 0-1.5-.7-1.5-1.5V9c0-.8.7-1.5 1.5-1.5h1V6c0-.8.7-1.5 1.5-1.5S11 5.2 11 6v1.5h1V5c0-.8.7-1.5 1.5-1.5S15 4.2 15 5v2.5h1V6c0-.8.7-1.5 1.5-1.5S19 5.2 19 6v1.5c.8 0 1.5.7 1.5 1.5v5.7c0 1.1-.4 2.1-1.1 2.9l-2.4 2.4c-.6.6-1.4.9-2.2.9H9.2c-.8 0-1.6-.3-2.2-.9L4.6 17.7c-.7-.7-1.1-1.7-1.1-2.9V9c0-.8.7-1.5 1.5-1.5z" />
            </svg>
          );
        case "paper":
          return (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={color}>
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h12v16H6V4z" />
              <path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" />
            </svg>
          );
        case "scissors":
          return (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={color}>
              <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2zm0 12c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z" />
            </svg>
          );
        default:
          return (
            <div
              style={{
                width: iconSize,
                height: iconSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: iconSize * 0.6,
                color: "#666",
              }}
            >
              ?
            </div>
          );
      }
    };

    const creatorName =
      matchData.playerNames?.creator ||
      `${matchData.players.creator.slice(0, 6)}...${matchData.players.creator.slice(-4)}`;
    const joinerName =
      matchData.playerNames?.joiner ||
      `${matchData.players.joiner.slice(0, 6)}...${matchData.players.joiner.slice(-4)}`;

    const winner = matchData.result.winner;
    const isWinnerCreator = winner === matchData.players.creator;
    const winnerName = winner === "tie" ? "Tie Game!" : `${isWinnerCreator ? creatorName : joinerName} Wins!`;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            backgroundImage: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
            padding: "60px",
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: "bold",
              color: "#ffffff",
              marginBottom: "40px",
            }}
          >
            RPS-onChain Match
          </div>

          {/* Players and Moves */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-around",
              alignItems: "center",
              marginBottom: "60px",
            }}
          >
            {/* Creator */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ marginBottom: "20px" }}>{getMoveIcon(matchData.moves.creatorMove)}</div>
              <div style={{ fontSize: 32, color: "#888" }}>{creatorName}</div>
            </div>

            {/* VS */}
            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: "bold",
                color: "#666",
              }}
            >
              VS
            </div>

            {/* Joiner */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ marginBottom: "20px" }}>{getMoveIcon(matchData.moves.joinerMove)}</div>
              <div style={{ fontSize: 32, color: "#888" }}>{joinerName}</div>
            </div>
          </div>

          {/* Winner */}
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: "bold",
              color: winner === "tie" ? "#fbbf24" : "#10b981",
              marginBottom: "20px",
            }}
          >
            {winner === "tie" ? "🤝" : "🏆"} {winnerName}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#666",
            }}
          >
            Play at rpsonchain.xyz
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a1a1a",
            color: "white",
          }}
        >
          <div style={{ fontSize: 60, fontWeight: "bold" }}>Error Loading Match</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
