"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { BalanceDisplay } from "~~/components/BalanceDisplay";
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
  const [isRecovering, setIsRecovering] = useState(true);
  const [hasShownJoinNotification, setHasShownJoinNotification] = useState(false);

  const { data: game, refetch } = useScaffoldReadContract({
    contractName: "RPSOnline",
    functionName: "getGame",
    args: [roomId],
  });

  const moves: Move[] = ["rock", "paper", "scissors"];

  // Recover state from contract on load
  useEffect(() => {
    if (!game || !address) return;

    const recoverState = async () => {
      // Game finished - fetch results
      if (game.state === 2) {
        try {
          const response = await fetch(`/api/room/paid/status?roomId=${roomId}&player=${address}`);
          const data = await response.json();
          if (data.finished) {
            setSelectedMove(address === game.player1 ? data.creatorMove : data.joinerMove);
            setOpponentMove(data.opponentMove);
            setResult(data.result);
          }
        } catch (error) {
          console.error("Error recovering state:", error);
        }
      }

      setIsRecovering(false);
    };

    recoverState();
  }, [game, address, roomId]);

  useEffect(() => {
    if (!game || game.player1 === "0x0000000000000000000000000000000000000000") return;

    const interval = setInterval(() => {
      refetch();
    }, 2000);

    return () => clearInterval(interval);
  }, [game, refetch]);

  // Auto-redirect when opponent joins
  useEffect(() => {
    if (!game || hasShownJoinNotification) return;

    const hasOpponent = game.player2 !== "0x0000000000000000000000000000000000000000";
    const isCreator = game.player1 === address;

    if (hasOpponent && isCreator) {
      setHasShownJoinNotification(true);
      toast.success("🎮 Opponent joined! Redirecting in 3 seconds...", {
        duration: 3000,
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #10b981",
        },
      });
      setTimeout(() => {
        router.push(`/game/paid/${roomId}`);
      }, 3000);
    }
  }, [game, address, hasShownJoinNotification, router, roomId]);

  const submitMove = async (move: Move) => {
    setIsSubmitting(true);
    setSelectedMove(move);

    try {
      await fetch("/api/room/paid/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          player: address,
          move,
          betAmount: game ? (Number(game.betAmount) / 1e18).toString() : "0",
        }),
      });

      // Always poll contract state for game completion
      const pollInterval = setInterval(async () => {
        const { data: updatedGame } = await refetch();

        if (updatedGame && updatedGame.state === 2) {
          clearInterval(pollInterval);

          const pollResponse = await fetch(`/api/room/paid/status?roomId=${roomId}&player=${address}`);
          const pollData = await pollResponse.json();

          if (pollData.finished) {
            setOpponentMove(pollData.opponentMove);
            setResult(pollData.result);
            setIsSaving(true);

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
                players: { creator: updatedGame.player1, joiner: updatedGame.player2 },
                betAmount: (Number(updatedGame.betAmount) / 1e18).toString(),
                games: [
                  {
                    creatorMove: updatedGame.player1 === address ? move : pollData.opponentMove,
                    joinerMove: updatedGame.player2 === address ? move : pollData.opponentMove,
                    winner: pollData.winner,
                    timestamp: new Date().toISOString(),
                    ipfsHash: pollData.ipfsHash,
                  },
                ],
              });
              localStorage.setItem("rps_matches", JSON.stringify(matches.slice(0, 50)));
            }
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Error submitting move:", error);
      toast.error("Failed to submit move", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #ef4444",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasOpponent = game?.player2 !== "0x0000000000000000000000000000000000000000";

  // Set game active flag when both players joined
  useEffect(() => {
    if (hasOpponent && game?.state === 1) {
      sessionStorage.setItem("paidGameActive", "true");
    }
    if (game?.state === 2) {
      sessionStorage.removeItem("paidGameActive");
    }
  }, [hasOpponent, game?.state]);

  // Store active room ID for navigation checks
  useEffect(() => {
    if (!hasOpponent && game?.player1 === address) {
      sessionStorage.setItem("activeWaitingRoom", roomId);
    } else {
      sessionStorage.removeItem("activeWaitingRoom");
    }
  }, [hasOpponent, game?.player1, address, roomId]);

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

  if (!hasOpponent) {
    const roomAge = Date.now() - Number(game.createdAt) * 1000;
    const isExpired = roomAge > 10 * 60 * 1000; // 10 minutes

    return (
      <div className="p-6 pt-12 pb-24 max-w-2xl mx-auto">
        <div className="absolute top-4 right-4 z-10">
          <BalanceDisplay address={address} format="full" />
        </div>
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Waiting for Opponent...</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center mb-4">
          <p className="text-lg font-mono mb-4">Room Code: {roomId}</p>
          <p className="text-base-content/60 mb-4">Share this code with your opponent</p>
          <p className="text-primary font-semibold">Bet: {Number(game.betAmount) / 1e18} CELO</p>
          {isExpired && <p className="text-warning text-sm mt-4">Room expired - You can claim refund</p>}
        </div>
        {isExpired && (
          <button
            onClick={async () => {
              try {
                await fetch("/api/room/refund-expired", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ roomId }),
                });
                sessionStorage.removeItem("activeWaitingRoom");
                router.push("/play/paid");
              } catch (error) {
                console.error("Error claiming refund:", error);
              }
            }}
            className="btn btn-warning w-full mb-2"
          >
            Claim Refund
          </button>
        )}
      </div>
    );
  }

  if (isRecovering) {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">Loading game...</p>
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!selectedMove) {
    return (
      <div className="p-6 pt-12 pb-24 max-w-2xl mx-auto">
        <div className="absolute top-4 right-4 z-10">
          <BalanceDisplay address={address} format="full" />
        </div>
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
    const gameAge = game ? Date.now() - Number(game.createdAt) * 1000 : 0;
    const isAbandoned = gameAge > 10 * 60 * 1000; // 10 minutes

    return (
      <div className="p-6 pt-12 pb-24 max-w-2xl mx-auto">
        <div className="absolute top-4 right-4 z-10">
          <BalanceDisplay address={address} format="full" />
        </div>
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Waiting for Result...</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">
            Your move: <span className="font-bold uppercase">{selectedMove}</span>
          </p>
          <p className="text-base-content/60">Waiting for opponent move...</p>
          {isAbandoned && (
            <div className="mt-6">
              <p className="text-warning text-sm mb-3">Game abandoned - Claim your refund</p>
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/room/refund-expired", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ roomId }),
                    });
                    toast.success("Refund claimed!");
                    router.push("/play/paid");
                  } catch (error) {
                    console.error("Error claiming refund:", error);
                    toast.error("Failed to claim refund");
                  }
                }}
                className="btn btn-warning w-full"
              >
                Claim Refund
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 pb-24 max-w-2xl mx-auto">
      <div className="absolute top-4 right-4 z-10">
        <BalanceDisplay address={address} format="full" />
      </div>
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
            <p className="text-sm text-base-content/60 mt-2">Winnings sent to your wallet (minus 0.75% fee)</p>
          )}
          {result === "tie" && <p className="text-sm text-base-content/60 mt-2">Bet refunded to both players</p>}
          {isSaving && (
            <p className="text-sm text-primary mt-2 flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              Saving to history...
            </p>
          )}
        </div>

        <button
          onClick={() => {
            sessionStorage.removeItem("paidGameActive");
            router.push("/play");
          }}
          disabled={isSaving}
          className="btn btn-primary w-full"
        >
          Back to Play
        </button>
      </div>
    </div>
  );
}
