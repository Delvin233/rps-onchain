"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginButton } from "~~/components/LoginButton";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";

interface MatchData {
  roomId: string;
  matchId: string;
  players: {
    creator: string;
    joiner: string;
  };
  moves: {
    creatorMove: string;
    joinerMove: string;
  };
  result: {
    winner: string;
    timestamp: number;
  };
  playerNames?: {
    creator: string;
    joiner: string;
  };
  betAmount?: string;
  ipfsHash?: string;
}

interface MatchShareClientProps {
  roomId: string;
  matchId: string;
}

export default function MatchShareClient({ roomId, matchId }: MatchShareClientProps) {
  const router = useRouter();
  const { isMiniApp } = usePlatformDetection();

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/share/${roomId}?matchId=${matchId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Match not found or has expired");
        } else {
          setError("Failed to load match data");
        }
        return;
      }

      const data = await response.json();
      setMatchData(data);
    } catch (err) {
      console.error("Error fetching match data:", err);
      setError("Failed to load match data");
    } finally {
      setLoading(false);
    }
  }, [roomId, matchId]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

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

  const handleChallengeWinner = () => {
    // Navigate to multiplayer page to create a new room
    router.push("/play/multiplayer");
  };

  const handlePlayNow = () => {
    // Navigate to multiplayer page
    router.push("/play/multiplayer");
  };

  if (loading) {
    return (
      <div className="p-6 pt-12 pb-24 flex items-center justify-center min-h-screen">
        <div className="bg-card/50 border border-border rounded-xl p-8 text-center max-w-md w-full">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/60">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="p-6 pt-12 pb-24 flex items-center justify-center min-h-screen">
        <div className="bg-card/50 border border-border rounded-xl p-8 text-center max-w-md w-full">
          <div className="text-error text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Match Not Found</h1>
          <p className="text-base-content/60 mb-6">{error || "This match may have expired or doesn't exist."}</p>
          <button onClick={handlePlayNow} className="btn btn-primary w-full">
            Play RPS Now
          </button>
        </div>
      </div>
    );
  }

  const creatorName =
    matchData.playerNames?.creator ||
    `${matchData.players.creator.slice(0, 6)}...${matchData.players.creator.slice(-4)}`;
  const joinerName =
    matchData.playerNames?.joiner || `${matchData.players.joiner.slice(0, 6)}...${matchData.players.joiner.slice(-4)}`;

  const winner = matchData.result.winner;
  const isWinnerCreator = winner === matchData.players.creator;
  const winnerName = winner === "tie" ? "Tie" : isWinnerCreator ? creatorName : joinerName;

  return (
    <div className="p-6 pt-12 pb-24 max-w-md mx-auto">
      {!isMiniApp && (
        <div className="flex justify-end mb-4">
          <LoginButton size="sm" />
        </div>
      )}

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">RPS Match Result</h1>
        <p className="text-base-content/60">{new Date(matchData.result.timestamp).toLocaleDateString()}</p>
      </div>

      {/* Match Result Display */}
      <div className="bg-card/50 border border-border rounded-xl p-6 mb-6">
        {/* Players and Moves */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-base-content/60 mb-1">{creatorName}</p>
            <div className="text-4xl mb-2">{getMoveEmoji(matchData.moves.creatorMove)}</div>
            <p className="text-sm font-medium capitalize">{matchData.moves.creatorMove}</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-base-content/60 mb-1">{joinerName}</p>
            <div className="text-4xl mb-2">{getMoveEmoji(matchData.moves.joinerMove)}</div>
            <p className="text-sm font-medium capitalize">{matchData.moves.joinerMove}</p>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex-1 border-t border-border"></div>
          <span className="px-4 text-base-content/60 font-bold">VS</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        {/* Winner */}
        <div className="text-center">
          <p className={`text-2xl font-bold ${winner === "tie" ? "text-warning" : "text-success"}`}>
            {winner === "tie" ? "🤝 Tie Game!" : `🏆 ${winnerName} Wins!`}
          </p>

          {matchData.betAmount && matchData.betAmount !== "0" && (
            <p className="text-sm text-base-content/60 mt-2">Bet: {matchData.betAmount} CELO</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button onClick={handleChallengeWinner} className="btn btn-primary w-full">
          {winner === "tie" ? "Play Again" : `Challenge ${winnerName}`}
        </button>

        <button onClick={handlePlayNow} className="btn btn-outline w-full">
          Create New Game
        </button>
      </div>

      {/* Match Info */}
      <div className="mt-6 p-4 bg-base-200/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-base-content/60">Room ID:</span>
          <span className="font-mono">{roomId}</span>
        </div>

        {matchData.ipfsHash && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-base-content/60">Verified:</span>
            <span className="text-success">✓ On-chain</span>
          </div>
        )}
      </div>
    </div>
  );
}
