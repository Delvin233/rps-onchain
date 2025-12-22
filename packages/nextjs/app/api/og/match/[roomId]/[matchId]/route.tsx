import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { roomId: string; matchId: string } }) {
  try {
    const { roomId, matchId } = params;

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

    const getMoveEmoji = (move: string) => {
      switch (move.toLowerCase()) {
        case "rock":
          return "🪨";
        case "paper":
          return "📄";
        case "scissors":
          return "✂️";
        default:
          return "❓";
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
              <div style={{ fontSize: 120, marginBottom: "20px" }}>{getMoveEmoji(matchData.moves.creatorMove)}</div>
              <div style={{ fontSize: 32, color: "#888", marginBottom: "10px" }}>{creatorName}</div>
              <div
                style={{
                  fontSize: 28,
                  color: "#fff",
                  textTransform: "capitalize",
                }}
              >
                {matchData.moves.creatorMove}
              </div>
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
              <div style={{ fontSize: 120, marginBottom: "20px" }}>{getMoveEmoji(matchData.moves.joinerMove)}</div>
              <div style={{ fontSize: 32, color: "#888", marginBottom: "10px" }}>{joinerName}</div>
              <div
                style={{
                  fontSize: 28,
                  color: "#fff",
                  textTransform: "capitalize",
                }}
              >
                {matchData.moves.joinerMove}
              </div>
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
