"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft } from "lucide-react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

type Move = "rock" | "paper" | "scissors";

const TAB_ID = typeof window !== "undefined" ? `tab_${Date.now()}_${Math.random()}` : "";

export default function SinglePlayerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
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

      // Store to Redis history
      await fetch("/api/history-fast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          match: {
            opponent: "AI",
            player: address,
            playerMove: move,
            opponentMove: data.aiMove,
            result: data.result,
            timestamp: new Date().toISOString(),
          },
        }),
      });
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-glow-primary mb-3 animate-glow">Single Player</h1>
            <p className="text-base-content/70">Connect Wallet</p>
          </div>
          <div className="w-full">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="w-full bg-gradient-primary hover:scale-105 transform transition-all duration-200 text-lg font-semibold shadow-glow-primary rounded-xl py-4 px-6"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6 pt-12 pb-24">
      <div className="flex items-center mb-4">
        <button onClick={() => handleNavigation("/play")} className="btn btn-sm btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-glow-primary ml-2">Single Player</h1>
      </div>
      <div className="flex justify-end mb-6 lg:hidden">
        <RainbowKitCustomConnectButton />
      </div>

      {!playerMove ? (
        <div className="space-y-4">
          <p className="text-center text-base-content/60 mb-6">Choose your move</p>
          {moves.map(move => (
            <button
              key={move}
              onClick={() => playGame(move)}
              disabled={isPlaying}
              className="w-full bg-card/50 backdrop-blur border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200 disabled:opacity-50"
            >
              <p className="text-xl font-semibold capitalize">{move}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
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
          <div className="bg-base-100 border border-warning/30 rounded-xl p-6 max-w-md w-full shadow-glow-warning">
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
