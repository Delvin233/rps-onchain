"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoginButton } from "~~/components/LoginButton";
import { useAIMatchCompletion } from "~~/hooks/useAIMatchCompletion";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";

type Move = "rock" | "paper" | "scissors";

const TAB_ID = typeof window !== "undefined" ? `tab_${Date.now()}_${Math.random()}` : "";

export default function SinglePlayerPage() {
  const router = useRouter();
  const { address, isConnected } = useConnectedAddress();
  const { isMiniApp } = usePlatformDetection();
  const { updateLeaderboard } = useAIMatchCompletion();
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [aiMove, setAiMove] = useState<Move | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "tie" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionStorage.getItem(`aiGameActive_${TAB_ID}`) === "true") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (sessionStorage.getItem(`aiGameActive_${TAB_ID}`) === "true") {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
        setPendingNavigation("/play");
        setShowExitConfirm(true);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleNavigation = (path: string) => {
    if (sessionStorage.getItem(`aiGameActive_${TAB_ID}`) === "true") {
      setPendingNavigation(path);
      setShowExitConfirm(true);
    } else {
      router.push(path);
    }
  };

  const confirmExit = () => {
    sessionStorage.removeItem(`aiGameActive_${TAB_ID}`);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const moves: Move[] = ["rock", "paper", "scissors"];

  const playGame = async (move: Move) => {
    setIsPlaying(true);
    setPlayerMove(move);
    setAiMove(null);
    setResult(null);
    sessionStorage.setItem(`aiGameActive_${TAB_ID}`, "true");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch("/api/play-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerMove: move, address }),
      });

      if (!response.ok) throw new Error("Failed to play against AI");

      const data = await response.json();
      setAiMove(data.aiMove);
      setResult(data.result);
      setIsPlaying(false);

      // Generate unique match ID for verification
      const matchId = `${address}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store to Redis history with matchId
      await fetch("/api/history-fast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          match: {
            id: matchId,
            opponent: "AI",
            player: address,
            playerMove: move,
            opponentMove: data.aiMove,
            result: data.result,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      // Update leaderboard if player won (with matchId for verification)
      if (address && data.result === "win") {
        await updateLeaderboard(address, true, matchId);
      }
    } catch (error) {
      console.error("Error playing AI:", error);
      sessionStorage.removeItem(`aiGameActive_${TAB_ID}`);
      setPlayerMove(null);
      setIsPlaying(false);
    }
  };

  const playAgain = () => {
    setPlayerMove(null);
    setAiMove(null);
    setResult(null);
    sessionStorage.removeItem(`aiGameActive_${TAB_ID}`);
  };

  const isMiniPayCheck = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 animate-glow">Single Player</h1>
          </div>
          {isMiniPayCheck ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <LoginButton />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 py-4 flex flex-col">
      <div className="flex items-start mb-4">
        <button onClick={() => handleNavigation("/play")} className="btn btn-sm btn-ghost flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold ml-2 break-words">Single Player</h1>
      </div>
      {!isMiniApp && (
        <div className="flex justify-end mb-6 lg:hidden">
          <LoginButton size="sm" />
        </div>
      )}

      {!playerMove ? (
        <div
          className="flex flex-col"
          style={{ gap: "clamp(0.75rem, 2vh, 1.5rem)", marginTop: "clamp(1rem, 2vh, 2rem)" }}
        >
          <p
            className="text-center text-base-content/60"
            style={{
              fontSize: "calc(clamp(0.875rem, 2.5vw, 1rem) * var(--font-size-override, 1))",
              marginBottom: "clamp(0.5rem, 1vh, 1rem)",
            }}
          >
            Choose your move
          </p>
          {moves.map(move => (
            <button
              key={move}
              onClick={() => playGame(move)}
              disabled={isPlaying}
              className="w-full bg-card/50 border border-border rounded-xl hover:border-primary/50 transition-all duration-200 disabled:opacity-50"
              style={{ padding: "clamp(1rem, 3vh, 2rem)" }}
            >
              <p
                className="font-semibold capitalize"
                style={{ fontSize: "calc(clamp(1rem, 3vw, 1.5rem) * var(--font-size-override, 1))" }}
              >
                {move}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card/50 border border-border rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-base-content/60 mb-2">You</p>
                <p className="text-2xl font-bold capitalize">{playerMove}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-base-content/60 mb-2">AI</p>
                <p className="text-2xl font-bold capitalize">{aiMove || "..."}</p>
              </div>
            </div>

            {result && (
              <div className="text-center mt-6">
                <p
                  className={`text-3xl font-bold ${
                    result === "win" ? "text-success" : result === "lose" ? "text-error" : "text-warning"
                  }`}
                >
                  {result === "win" ? "You Win!" : result === "lose" ? "You Lose!" : "It's a Tie!"}
                </p>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-3">
              <button onClick={playAgain} className="btn btn-primary w-full">
                Play Again
              </button>
              <button onClick={() => handleNavigation("/play")} className="btn btn-outline w-full">
                Back to Play
              </button>
            </div>
          )}
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 border border-warning/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-warning">Leave Game?</h3>
            <p className="text-base-content/80 mb-6">You have an active game. Are you sure you want to leave?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="btn btn-ghost flex-1">
                Stay
              </button>
              <button onClick={confirmExit} className="btn btn-warning flex-1">
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
