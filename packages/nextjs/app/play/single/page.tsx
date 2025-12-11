"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { BestOfThreeExplanationModal } from "~~/components/BestOfThreeExplanationModal";
import { LoginButton } from "~~/components/LoginButton";
import { MatchScoreboard } from "~~/components/MatchScoreboard";
import { ResumeMatchModal } from "~~/components/ResumeMatchModal";
import { useAIMatchCompletion } from "~~/hooks/useAIMatchCompletion";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";
import { AIMatch, Move, RoundResult } from "~~/types/aiMatch";

type GameState = "loading" | "menu" | "playing" | "round-result" | "match-complete";

export default function SinglePlayerPage() {
  const router = useRouter();
  const { address, isConnected } = useConnectedAddress();
  const { isMiniApp } = usePlatformDetection();
  const { updateLeaderboard } = useAIMatchCompletion();

  // Match state
  const [currentMatch, setCurrentMatch] = useState<AIMatch | null>(null);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [isAnimating, setIsAnimating] = useState(false);

  // Round state
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [aiMove, setAiMove] = useState<Move | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  // UI state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);

  // Check for existing match on load and show explanation for first-time users
  useEffect(() => {
    if (!address) return;

    const checkForActiveMatch = async () => {
      try {
        const response = await fetch(`/api/ai-match/resume?address=${address}`);
        const data = await response.json();

        if (data.match) {
          setCurrentMatch(data.match);
          setShowResumeModal(true);
          setGameState("menu");

          // Calculate time remaining (10 minutes from last activity)
          const lastActivity = new Date(data.match.lastActivityAt);
          const now = new Date();
          const diffMinutes = 10 - Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
          setTimeRemaining(Math.max(0, diffMinutes));
        } else {
          setGameState("menu");

          // Check if this is the user's first time with best-of-three
          const hasSeenExplanation = localStorage.getItem(`bestOfThreeExplanation_${address}`);
          if (!hasSeenExplanation) {
            setShowExplanationModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking for active match:", error);
        setGameState("menu");

        // Still show explanation for first-time users even if there's an error
        const hasSeenExplanation = localStorage.getItem(`bestOfThreeExplanation_${address}`);
        if (!hasSeenExplanation) {
          setShowExplanationModal(true);
        }
      }
    };

    checkForActiveMatch();
  }, [address]);

  // Handle browser navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentMatch && gameState !== "menu" && gameState !== "match-complete") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (currentMatch && gameState !== "menu" && gameState !== "match-complete") {
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
  }, [currentMatch, gameState]);

  const handleNavigation = (path: string) => {
    if (currentMatch && gameState !== "menu" && gameState !== "match-complete") {
      setPendingNavigation(path);
      setShowExitConfirm(true);
    } else {
      router.push(path);
    }
  };

  const confirmExit = async () => {
    if (currentMatch) {
      try {
        await fetch("/api/ai-match/abandon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: currentMatch.id }),
        });
      } catch (error) {
        console.error("Error abandoning match:", error);
      }
    }

    setCurrentMatch(null);
    setGameState("menu");
    setShowExitConfirm(false);

    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const startNewMatch = async () => {
    if (!address) return;

    try {
      setGameState("loading");

      // Mark that user has seen the explanation
      localStorage.setItem(`bestOfThreeExplanation_${address}`, "true");

      const response = await fetch("/api/ai-match/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) throw new Error("Failed to start match");

      const data = await response.json();
      setCurrentMatch(data.match);
      setGameState("playing");
      setPlayerMove(null);
      setAiMove(null);
      setRoundResult(null);
    } catch (error) {
      console.error("Error starting match:", error);
      setGameState("menu");
    }
  };

  const resumeMatch = () => {
    setShowResumeModal(false);
    setGameState("playing");
    setPlayerMove(null);
    setAiMove(null);
    setRoundResult(null);
  };

  const abandonMatch = async () => {
    if (!currentMatch) return;

    try {
      await fetch("/api/ai-match/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: currentMatch.id }),
      });
    } catch (error) {
      console.error("Error abandoning match:", error);
    }

    setCurrentMatch(null);
    setShowResumeModal(false);
    setGameState("menu");
  };

  const moves: Move[] = ["rock", "paper", "scissors"];

  const playRound = async (move: Move) => {
    if (!currentMatch) return;

    setPlayerMove(move);
    setAiMove(null);
    setRoundResult(null);
    setGameState("loading");

    try {
      // Add delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch("/api/ai-match/play-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: currentMatch.id,
          playerMove: move,
        }),
      });

      if (!response.ok) throw new Error("Failed to play round");

      const data = await response.json();
      setCurrentMatch(data.match);
      setAiMove(data.roundResult.aiMove);
      setRoundResult(data.roundResult);

      // Trigger score animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);

      // Check if match is complete
      if (data.match.status === "completed") {
        setGameState("match-complete");

        // Update leaderboard if player won
        if (address && data.match.winner === "player") {
          await updateLeaderboard(address, true, data.match.id);
        }
      } else {
        setGameState("round-result");
      }
    } catch (error) {
      console.error("Error playing round:", error);
      setGameState("playing");
      setPlayerMove(null);
    }
  };

  const nextRound = () => {
    setPlayerMove(null);
    setAiMove(null);
    setRoundResult(null);
    setGameState("playing");
  };

  const playAgain = () => {
    setCurrentMatch(null);
    setPlayerMove(null);
    setAiMove(null);
    setRoundResult(null);
    setGameState("menu");
  };

  const handleExplanationClose = () => {
    setShowExplanationModal(false);
    if (address) {
      localStorage.setItem(`bestOfThreeExplanation_${address}`, "true");
    }
  };

  const handleExplanationStartMatch = () => {
    setShowExplanationModal(false);
    startNewMatch();
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
    <div
      className="min-h-screen bg-base-200 px-4 py-2 flex flex-col max-h-screen overflow-hidden"
      style={{ height: "100vh" }}
    >
      <div className="flex items-start mb-2">
        <button onClick={() => handleNavigation("/play")} className="btn btn-sm btn-ghost flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold ml-2 break-words">Single Player</h1>
      </div>
      {!isMiniApp && (
        <div className="flex justify-end mb-3 lg:hidden">
          <LoginButton size="sm" />
        </div>
      )}

      {/* Match Scoreboard - shown when there's an active match */}
      {currentMatch && (
        <MatchScoreboard
          playerScore={currentMatch.playerScore}
          aiScore={currentMatch.aiScore}
          currentRound={currentMatch.currentRound}
          maxRounds={3}
          isAnimating={isAnimating}
        />
      )}

      {/* Game State Rendering */}
      {gameState === "loading" && (
        <div className="flex justify-center items-center flex-1">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {gameState === "menu" && (
        <div className="flex flex-col items-center justify-center flex-1 space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-2">Best of Three</h2>
            <p className="text-base-content/60 text-sm">First to win 2 rounds wins the match!</p>
          </div>
          <button onClick={startNewMatch} className="btn btn-primary btn-lg w-full max-w-md gap-2">
            <Play size={20} />
            Start New Match
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex flex-col flex-1 justify-center" style={{ gap: "0.75rem" }}>
          <p className="text-center text-base-content/60 text-sm mb-2">Choose your move</p>
          <div className="space-y-3">
            {moves.map(move => (
              <button
                key={move}
                onClick={() => playRound(move)}
                className="w-full bg-card/50 border border-border rounded-xl hover:border-primary/50 transition-all duration-200 py-4 px-6"
              >
                <p className="font-semibold capitalize text-lg">{move}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === "round-result" && (
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="bg-card/50 border border-border rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <p className="text-xs text-base-content/60 mb-1">You</p>
                <p className="text-xl font-bold capitalize">{playerMove}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-base-content/60 mb-1">AI</p>
                <p className="text-xl font-bold capitalize">{aiMove}</p>
              </div>
            </div>

            {roundResult && (
              <div className="text-center mt-3">
                <p
                  className={`text-xl font-bold ${
                    roundResult.winner === "player"
                      ? "text-success"
                      : roundResult.winner === "ai"
                        ? "text-error"
                        : "text-warning"
                  }`}
                >
                  {roundResult.winner === "player"
                    ? "You Win This Round!"
                    : roundResult.winner === "ai"
                      ? "AI Wins This Round!"
                      : "Round Tied!"}
                </p>
              </div>
            )}
          </div>

          <button onClick={nextRound} className="btn btn-primary w-full">
            Next Round
          </button>
        </div>
      )}

      {gameState === "match-complete" && currentMatch && (
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="bg-card/50 border border-border rounded-xl p-4">
            <div className="text-center">
              <div className="text-4xl mb-3">
                {currentMatch.winner === "player" ? "🎉" : currentMatch.winner === "ai" ? "😔" : "🤝"}
              </div>
              <h2
                className={`text-2xl font-bold mb-2 ${
                  currentMatch.winner === "player"
                    ? "text-success"
                    : currentMatch.winner === "ai"
                      ? "text-error"
                      : "text-warning"
                }`}
              >
                {currentMatch.winner === "player" ? "Victory!" : currentMatch.winner === "ai" ? "Defeat!" : "Draw!"}
              </h2>
              <p className="text-base-content/60 text-sm">
                Final Score: {currentMatch.playerScore} - {currentMatch.aiScore}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button onClick={playAgain} className="btn btn-primary w-full">
              Play Again
            </button>
            <button onClick={() => handleNavigation("/play")} className="btn btn-outline w-full">
              Back to Play
            </button>
          </div>
        </div>
      )}

      {/* Resume Match Modal */}
      {showResumeModal && currentMatch && (
        <ResumeMatchModal
          match={currentMatch}
          onResume={resumeMatch}
          onAbandon={abandonMatch}
          timeRemaining={timeRemaining}
          isVisible={showResumeModal}
        />
      )}

      {/* Best-of-Three Explanation Modal */}
      <BestOfThreeExplanationModal
        isVisible={showExplanationModal}
        onClose={handleExplanationClose}
        onStartMatch={handleExplanationStartMatch}
      />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 border border-warning/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-warning">Leave Match?</h3>
            <p className="text-base-content/80 mb-6">
              You have an active match. Leaving will abandon the match and count as a loss.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="btn btn-ghost flex-1">
                Stay
              </button>
              <button onClick={confirmExit} className="btn btn-warning flex-1">
                Leave & Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
