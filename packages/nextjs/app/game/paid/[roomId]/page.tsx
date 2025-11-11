"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type Move = "rock" | "paper" | "scissors";

export default function PaidGamePage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const roomId = params.roomId as string;

  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "tie" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: game, refetch } = useScaffoldReadContract({
    contractName: "RPSOnline",
    functionName: "getGame",
    args: [roomId],
  });

  const moves: Move[] = ["rock", "paper", "scissors"];

  useEffect(() => {
    if (!game || game.player1 === "0x0000000000000000000000000000000000000000") return;

    const interval = setInterval(() => {
      refetch();
    }, 2000);

    return () => clearInterval(interval);
  }, [game, refetch]);

  const submitMove = async (move: Move) => {
    setIsSubmitting(true);
    setSelectedMove(move);

    try {
      const response = await fetch("/api/room/paid/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          player: address,
          move,
          betAmount: game ? (Number(game.betAmount) / 1e18).toString() : "0",
        }),
      });

      const data = await response.json();
      if (data.finished && game) {
        setOpponentMove(data.opponentMove);
        setResult(data.result);
        setIsSaving(true);

        // Sync matches from IPFS to localStorage
        const hashResponse = await fetch(`/api/user-matches?address=${address}`);
        const { ipfsHash } = await hashResponse.json();
        if (ipfsHash) {
          const userData = await (await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)).json();
          if (userData.matches) {
            localStorage.setItem("rps_matches", JSON.stringify(userData.matches));
          }
        }
        setIsSaving(false);

        if (data.ipfsHash) {
          const matches = JSON.parse(localStorage.getItem("rps_matches") || "[]");
          matches.unshift({
            roomId,
            players: { creator: game.player1, joiner: game.player2 },
            betAmount: (Number(game.betAmount) / 1e18).toString(),
            games: [
              {
                creatorMove: game.player1 === address ? move : data.opponentMove,
                joinerMove: game.player2 === address ? move : data.opponentMove,
                winner: data.winner,
                timestamp: Date.now(),
                ipfsHash: data.ipfsHash,
              },
            ],
          });
          localStorage.setItem("rps_matches", JSON.stringify(matches.slice(0, 50)));
        }
      } else {
        const pollInterval = setInterval(async () => {
          const pollResponse = await fetch(`/api/room/paid/status?roomId=${roomId}&player=${address}`);
          const pollData = await pollResponse.json();

          if (pollData.finished && game) {
            setOpponentMove(pollData.opponentMove);
            setResult(pollData.result);
            setIsSaving(true);

            // Sync matches from IPFS to localStorage
            const hashResponse = await fetch(`/api/user-matches?address=${address}`);
            const { ipfsHash } = await hashResponse.json();
            if (ipfsHash) {
              const userData = await (await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)).json();
              if (userData.matches) {
                localStorage.setItem("rps_matches", JSON.stringify(userData.matches));
              }
            }
            setIsSaving(false);

            if (pollData.ipfsHash) {
              const matches = JSON.parse(localStorage.getItem("rps_matches") || "[]");
              matches.unshift({
                roomId,
                players: { creator: game.player1, joiner: game.player2 },
                betAmount: (Number(game.betAmount) / 1e18).toString(),
                games: [
                  {
                    creatorMove: game.player1 === address ? move : pollData.opponentMove,
                    joinerMove: game.player2 === address ? move : pollData.opponentMove,
                    winner: pollData.winner,
                    timestamp: Date.now(),
                    ipfsHash: pollData.ipfsHash,
                  },
                ],
              });
              localStorage.setItem("rps_matches", JSON.stringify(matches.slice(0, 50)));
            }

            clearInterval(pollInterval);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error submitting move:", error);
      toast.error("Failed to submit move");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!game || game.player1 === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">Room not found</p>
          <button onClick={() => router.push("/play/paid")} className="btn btn-primary">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const hasOpponent = game.player2 !== "0x0000000000000000000000000000000000000000";

  if (!hasOpponent) {
    return (
      <div className="p-6 pt-12 pb-24">
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Waiting for Opponent...</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg font-mono mb-4">Room Code: {roomId}</p>
          <p className="text-base-content/60 mb-4">Share this code with your opponent</p>
          <p className="text-primary font-semibold">Bet: {Number(game.betAmount) / 1e18} CELO</p>
        </div>
      </div>
    );
  }

  if (!selectedMove) {
    return (
      <div className="p-6 pt-12 pb-24">
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Choose Your Move</h1>
        <p className="text-center text-base-content/60 mb-6">Bet: {Number(game.betAmount) / 1e18} CELO</p>
        <div className="space-y-4">
          {moves.map(move => (
            <button
              key={move}
              onClick={() => submitMove(move)}
              disabled={isSubmitting}
              className="w-full bg-card/50 backdrop-blur border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200 disabled:opacity-50"
            >
              <p className="text-xl font-semibold capitalize">{move}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 pt-12 pb-24">
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Waiting for Result...</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">
            Your move: <span className="font-bold uppercase">{selectedMove}</span>
          </p>
          <p className="text-base-content/60">Waiting for opponent move...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 pb-24">
      <h1 className="text-2xl font-bold text-glow-primary mb-6">Game Over</h1>
      <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-base-content/60 mb-2">You</p>
            <p className="text-2xl font-bold capitalize">{selectedMove}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-base-content/60 mb-2">Opponent</p>
            <p className="text-2xl font-bold capitalize">{opponentMove}</p>
          </div>
        </div>

        <div className="text-center mb-6">
          <p
            className={`text-3xl font-bold ${
              result === "win" ? "text-success" : result === "lose" ? "text-error" : "text-warning"
            }`}
          >
            {result === "win" ? "You Win!" : result === "lose" ? "You Lose!" : "Tie!"}
          </p>
          {result === "win" && (
            <p className="text-sm text-base-content/60 mt-2">Winnings sent to your wallet (minus 1.25% fee)</p>
          )}
          {result === "tie" && <p className="text-sm text-base-content/60 mt-2">Bet refunded to both players</p>}
          {isSaving && (
            <p className="text-sm text-primary mt-2 flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              Saving to history...
            </p>
          )}
        </div>

        <button onClick={() => router.push("/play")} disabled={isSaving} className="btn btn-primary w-full">
          Back to Play
        </button>
      </div>
    </div>
  );
}
