"use client";

import { Bot, Clock, Play, Trophy, User, X } from "lucide-react";
import { AIMatch } from "~~/types/aiMatch";

interface ResumeMatchModalProps {
  match: AIMatch;
  onResume: () => void;
  onAbandon: () => void;
  timeRemaining?: number; // Minutes remaining before auto-abandonment
  isVisible: boolean;
}

export function ResumeMatchModal({ match, onResume, onAbandon, timeRemaining, isVisible }: ResumeMatchModalProps) {
  if (!isVisible) return null;

  const formatTimeRemaining = (minutes?: number): string => {
    if (!minutes) return "Unknown";
    if (minutes < 1) return "Less than 1 minute";
    return `${Math.floor(minutes)} minute${Math.floor(minutes) !== 1 ? "s" : ""}`;
  };

  const getTimeSinceLastActivity = (): string => {
    const now = new Date();
    const lastActivity = new Date(match.lastActivityAt);
    const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  };

  const isMatchClose = timeRemaining && timeRemaining < 3;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 border border-border rounded-xl p-6 max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Resume Match</h3>
          <button onClick={onAbandon} className="btn btn-sm btn-ghost btn-circle" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Match Progress Display */}
        <div className="bg-card/30 border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center gap-4 mb-3">
            {/* Player Score */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <User size={14} className="text-primary" />
                <span className="text-sm font-medium">You</span>
              </div>
              <div className="text-2xl font-bold">{match.playerScore}</div>
              {/* Win indicators */}
              <div className="flex justify-center gap-1 mt-1">
                {Array.from({ length: 2 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full border transition-all ${
                      i < match.playerScore ? "bg-success border-success" : "border-base-content/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* VS Divider */}
            <div className="text-center">
              <div className="text-base-content/40 text-xs font-medium">VS</div>
              <Trophy size={16} className="mx-auto text-warning mt-1" />
            </div>

            {/* AI Score */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Bot size={14} className="text-secondary" />
                <span className="text-sm font-medium">AI</span>
              </div>
              <div className="text-2xl font-bold">{match.aiScore}</div>
              {/* Win indicators */}
              <div className="flex justify-center gap-1 mt-1">
                {Array.from({ length: 2 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full border transition-all ${
                      i < match.aiScore ? "bg-success border-success" : "border-base-content/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Round Progress */}
          <div className="text-center">
            <div className="text-sm text-base-content/60 mb-2">Round {match.currentRound} of 3</div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < match.currentRound - 1
                      ? "bg-primary"
                      : i === match.currentRound - 1
                        ? "bg-primary/50"
                        : "bg-base-content/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Match Information */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <Clock size={16} />
            <span>Last played: {getTimeSinceLastActivity()}</span>
          </div>

          {timeRemaining && (
            <div
              className={`flex items-center gap-2 text-sm ${isMatchClose ? "text-warning" : "text-base-content/70"}`}
            >
              <Clock size={16} />
              <span>
                {isMatchClose ? "⚠️ " : ""}
                Auto-abandon in: {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          )}

          <div className="text-sm text-base-content/70">
            <span>Rounds played: {match.rounds.length}/3</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={onAbandon} className="btn btn-outline btn-error flex-1">
            Abandon Match
          </button>
          <button onClick={onResume} className="btn btn-primary flex-1 gap-2">
            <Play size={16} />
            Resume Match
          </button>
        </div>

        {/* Warning for close matches */}
        {isMatchClose && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-warning text-center">
              This match will be automatically abandoned soon if not resumed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
