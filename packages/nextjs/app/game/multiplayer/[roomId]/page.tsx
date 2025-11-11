"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { BalanceDisplay } from "~~/components/BalanceDisplay";

type Move = "rock" | "paper" | "scissors";
type GameStatus = "waiting" | "ready" | "playing" | "revealing" | "finished";

export default function MultiplayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const roomId = params.roomId as string;
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [betAmount, setBetAmount] = useState("0");
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "tie" | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentRequestedRematch, setOpponentRequestedRematch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const toastShownRef = useRef(false);
  const leftToastShownRef = useRef(false);

  const moves: Move[] = ["rock", "paper", "scissors"];

  useEffect(() => {
    if (!address) return;
    fetchRoomInfo();

    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(pollGameStatus, 500);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, address]);

  useEffect(() => {
    if (
      (gameStatus === "ready" || gameStatus === "playing") &&
      (result || rematchRequested || opponentRequestedRematch)
    ) {
      setSelectedMove(null);
      setOpponentMove(null);
      setResult(null);
      setRematchRequested(false);
      setOpponentRequestedRematch(false);
      toastShownRef.current = false;
    }
  }, [gameStatus, result, rematchRequested, opponentRequestedRematch]);

  const fetchRoomInfo = async () => {
    try {
      const response = await fetch(`/api/room/info?roomId=${roomId}`);
      const data = await response.json();
      setBetAmount(data.betAmount);
      setGameStatus(data.status);
      setIsFreeMode(data.isFree || false);
    } catch (error) {
      console.error("Error fetching room:", error);
    }
  };

  const pollGameStatus = async () => {
    try {
      const response = await fetch(`/api/room/status?roomId=${roomId}&player=${address}`);
      if (!response.ok) {
        console.error(`Room status API returned ${response.status}`);
        setErrorCount(prev => prev + 1);
        return;
      }
      setErrorCount(0);
      const data = await response.json();
      setGameStatus(data.status);

      if (data.status === "finished") {
        const isCreator = data.creator === address;
        setOpponentMove(isCreator ? data.joinerMove : data.creatorMove);
        const myResult = isCreator ? data.creatorResult : data.joinerResult;
        setResult(myResult);
        setIsSaving(true);

        // Save to localStorage - add game to room's match history
        const matchKey = `${data.roomId}_${data.creatorMove}_${data.joinerMove}`;
        if (data.ipfsHash && !sessionStorage.getItem(`match_saved_${matchKey}`)) {
          const matches = JSON.parse(localStorage.getItem("rps_matches") || "[]");
          const roomIndex = matches.findIndex((m: any) => m.roomId === data.roomId);

          const gameResult = {
            creatorMove: data.creatorMove,
            joinerMove: data.joinerMove,
            winner:
              myResult === "win" ? address : myResult === "lose" ? (isCreator ? data.joiner : data.creator) : "tie",
            timestamp: new Date().toISOString(),
            ipfsHash: data.ipfsHash,
          };

          if (roomIndex >= 0) {
            if (!matches[roomIndex].games) matches[roomIndex].games = [];
            matches[roomIndex].games.push(gameResult);
          } else {
            matches.push({
              roomId: data.roomId,
              players: { creator: data.creator, joiner: data.joiner },
              betAmount: data.betAmount || "0",
              games: [gameResult],
            });
          }

          localStorage.setItem("rps_matches", JSON.stringify(matches));
          sessionStorage.setItem(`match_saved_${matchKey}`, "true");
        }
        setIsSaving(false);
      }

      if (data.rematchRequested && data.rematchRequested !== address) {
        if (!opponentRequestedRematch && !toastShownRef.current) {
          setOpponentRequestedRematch(true);
          toastShownRef.current = true;
          toast.custom(
            (t: { id: string }) => (
              <div
                onClick={() => toast.dismiss(t.id)}
                className="bg-base-100 border border-success/50 rounded-lg p-4 shadow-lg cursor-pointer"
              >
                <p className="text-success font-semibold mb-2">Opponent wants to play again!</p>
                <div className="w-full bg-base-300 rounded-full h-1 overflow-hidden">
                  <div className="bg-success h-full animate-pulse" style={{ width: "100%" }}></div>
                </div>
              </div>
            ),
            { duration: 5000 },
          );
        }
      }

      if (data.playerLeft && data.playerLeft !== address && !leftToastShownRef.current) {
        leftToastShownRef.current = true;
        toast.custom(
          (t: { id: string }) => (
            <div
              onClick={() => toast.dismiss(t.id)}
              className="bg-base-100 border border-error/50 rounded-lg p-4 shadow-lg cursor-pointer"
            >
              <p className="text-error font-semibold mb-2">Opponent left the game</p>
              <div className="w-full bg-base-300 rounded-full h-1 overflow-hidden">
                <div className="bg-error h-full animate-pulse" style={{ width: "100%" }}></div>
              </div>
            </div>
          ),
          { duration: 2000 },
        );
        setTimeout(() => router.push("/play/multiplayer"), 2000);
      }
    } catch (error) {
      console.error("Error polling status:", error);
      setErrorCount(prev => prev + 1);
    }
  };

  const submitMove = async (move: Move) => {
    if (!address) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/room/submit-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          player: address,
          move,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedMove(move);
        setGameStatus("revealing");
      }
    } catch (error) {
      console.error("Error submitting move:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRoom = async () => {
    try {
      await fetch("/api/room/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, creator: address }),
      });
      router.push("/play/multiplayer");
    } catch (error) {
      console.error("Error cancelling room:", error);
    }
  };

  const requestRematch = async () => {
    if (opponentRequestedRematch) {
      await acceptRematch();
      return;
    }
    try {
      await fetch("/api/room/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, player: address, action: "request" }),
      });
      setRematchRequested(true);
      toast.success("Rematch requested!", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #10b981",
        },
      });
    } catch (error) {
      console.error("Error requesting rematch:", error);
    }
  };

  const acceptRematch = async () => {
    try {
      await fetch("/api/room/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, player: address, action: "accept" }),
      });
      setSelectedMove(null);
      setOpponentMove(null);
      setResult(null);
      setRematchRequested(false);
      setOpponentRequestedRematch(false);
      toastShownRef.current = false;
      toast.success("Rematch accepted!", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #10b981",
        },
      });
    } catch (error) {
      console.error("Error accepting rematch:", error);
    }
  };

  const leaveRoom = async () => {
    try {
      await fetch("/api/room/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, player: address, action: "leave" }),
      });
      router.push("/play/multiplayer");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">Please connect your wallet to play</p>
          <button onClick={() => router.push("/")} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (errorCount > 10) {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg text-error mb-4">Room connection lost</p>
          <p className="text-sm text-base-content/60 mb-6">
            The room may have expired or the server connection was interrupted.
          </p>
          <button onClick={() => router.push("/play/multiplayer")} className="btn btn-primary w-full">
            Back to Play
          </button>
        </div>
      </div>
    );
  }

  if (gameStatus === "waiting") {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="fixed top-4 right-4 z-10">
          <BalanceDisplay address={address} format="full" />
        </div>
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Waiting for Opponent...</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center mb-4">
          <p className="text-lg font-mono mb-4">Room Code: {roomId}</p>
          <p className="text-base-content/60">Share this code with your opponent</p>
          {!isFreeMode && <p className="text-primary font-semibold mt-4">Bet: {betAmount} CELO</p>}
          {isFreeMode && <p className="text-success font-semibold mt-4">Free Mode</p>}
        </div>
        <button onClick={cancelRoom} className="btn btn-error w-full">
          Cancel Room
        </button>
      </div>
    );
  }

  if ((gameStatus === "ready" || gameStatus === "playing") && !selectedMove) {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="fixed top-4 right-4 z-10">
          <BalanceDisplay address={address} format="full" />
        </div>
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Choose Your Move</h1>
        {!isFreeMode && <p className="text-center text-base-content/60 mb-6">Bet: {betAmount} CELO</p>}
        {isFreeMode && <p className="text-center text-success mb-6">Free Mode</p>}
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

  if (gameStatus === "revealing" || (selectedMove && !result)) {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="fixed top-4 right-4 z-10">
          <BalanceDisplay address={address} format="full" />
        </div>
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Waiting for Reveal...</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">
            Your move: <span className="font-bold uppercase">{selectedMove}</span>
          </p>
          <p className="text-base-content/60">Waiting for opponent move...</p>
        </div>
      </div>
    );
  }

  if (gameStatus === "finished" && result) {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="fixed top-4 right-4 z-10">
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
            {isSaving && (
              <p className="text-sm text-primary mt-2 flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                Saving to history...
              </p>
            )}
          </div>

          {isFreeMode && (
            <div className="space-y-3">
              {opponentRequestedRematch ? (
                <>
                  <button onClick={acceptRematch} disabled={isSaving} className="btn btn-success w-full">
                    Accept Rematch
                  </button>
                  <button onClick={leaveRoom} disabled={isSaving} className="btn btn-error w-full">
                    Leave Room
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={requestRematch}
                    disabled={rematchRequested || isSaving}
                    className="btn btn-primary w-full"
                  >
                    {rematchRequested ? "Waiting for opponent..." : "Play Again"}
                  </button>
                  <button onClick={leaveRoom} disabled={isSaving} className="btn btn-error w-full">
                    Back to Play
                  </button>
                </>
              )}
            </div>
          )}

          {!isFreeMode && (
            <button onClick={() => router.push("/play")} disabled={isSaving} className="btn btn-primary w-full">
              Back to Play
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
