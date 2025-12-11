"use client";

import { Bot, Trophy, User } from "lucide-react";

interface MatchScoreboardProps {
  playerScore: number;
  aiScore: number;
  currentRound: number;
  maxRounds: number;
  playerName?: string;
  isAnimating?: boolean;
}

export function MatchScoreboard({
  playerScore,
  aiScore,
  currentRound,
  maxRounds,
  playerName = "You",
  isAnimating = false,
}: MatchScoreboardProps) {
  const isMatchComplete = playerScore >= 2 || aiScore >= 2;
  const winner = playerScore >= 2 ? "player" : aiScore >= 2 ? "ai" : null;

  return (
    <div className="bg-card/50 border border-border rounded-xl p-4 mb-6">
      {/* Round Indicator */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-sm text-base-content/60">
            {isMatchComplete ? "Match Complete" : `Round ${currentRound}`}
          </span>
          {!isMatchComplete && <span className="text-xs text-base-content/40">of {maxRounds}</span>}
        </div>

        {/* Round Progress Dots */}
        {!isMatchComplete && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: maxRounds }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i < currentRound ? "bg-primary" : i === currentRound - 1 ? "bg-primary/50" : "bg-base-content/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-3 items-center gap-4">
        {/* Player Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <User size={16} className="text-primary" />
            <span className="text-sm font-medium text-base-content/80">{playerName}</span>
          </div>
          <div
            key={`player-${playerScore}`}
            className={`text-3xl font-bold transition-all duration-300 ${
              isAnimating ? "animate-pulse scale-110" : ""
            } ${winner === "player" ? "text-success" : "text-base-content"}`}
          >
            {playerScore}
          </div>
          {/* Win indicators */}
          <div className="flex justify-center gap-1 mt-1">
            {Array.from({ length: 2 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  i < playerScore ? "bg-success border-success" : "border-base-content/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* VS Divider */}
        <div className="text-center">
          <div className="text-base-content/40 text-sm font-medium">VS</div>
          {winner && (
            <div className="mt-2 animate-bounce">
              <Trophy size={20} className="mx-auto text-warning" />
            </div>
          )}
        </div>

        {/* AI Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot size={16} className="text-secondary" />
            <span className="text-sm font-medium text-base-content/80">AI</span>
          </div>
          <div
            key={`ai-${aiScore}`}
            className={`text-3xl font-bold transition-all duration-300 ${
              isAnimating ? "animate-pulse scale-110" : ""
            } ${winner === "ai" ? "text-success" : "text-base-content"}`}
          >
            {aiScore}
          </div>
          {/* Win indicators */}
          <div className="flex justify-center gap-1 mt-1">
            {Array.from({ length: 2 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  i < aiScore ? "bg-success border-success" : "border-base-content/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Match Status */}
      {isMatchComplete && winner && (
        <div className="text-center mt-4 pt-4 border-t border-border animate-fade-in">
          <p className={`text-lg font-bold ${winner === "player" ? "text-success" : "text-error"}`}>
            {winner === "player" ? "🎉 You Won the Match!" : "😔 AI Won the Match"}
          </p>
          <p className="text-sm text-base-content/60 mt-1">Best of {maxRounds} rounds</p>
        </div>
      )}
    </div>
  );
}
