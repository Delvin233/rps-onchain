"use client";

import { Bot, Calendar, Clock, Trophy, User, X } from "lucide-react";
import { AIMatch, Round } from "~~/types/aiMatch";

interface DetailedMatchViewProps {
  match: AIMatch | null;
  onClose: () => void;
  isVisible: boolean;
}

export function DetailedMatchView({ match, onClose, isVisible }: DetailedMatchViewProps) {
  if (!isVisible || !match) return null;

  const formatDuration = (startTime: Date, endTime?: Date): string => {
    if (!endTime) return "In progress";

    const durationMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString();
  };

  const getMoveEmoji = (move: string): string => {
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

  const getMoveDisplayText = (move: string): string => {
    switch (move.toLowerCase()) {
      case "rock":
        return "ROCK";
      case "paper":
        return "PAPER";
      case "scissors":
        return "SCISSORS";
      case "unknown":
        return "UNKNOWN";
      case "invalid":
        return "INVALID";
      default:
        return move.toUpperCase();
    }
  };

  const getResultColor = (winner: string): string => {
    switch (winner) {
      case "player":
        return "text-success";
      case "ai":
        return "text-error";
      case "tie":
        return "text-warning";
      default:
        return "text-base-content";
    }
  };

  const getResultText = (winner: string): string => {
    switch (winner) {
      case "player":
        return "You Won";
      case "ai":
        return "AI Won";
      case "tie":
        return "Tie";
      default:
        return "Unknown";
    }
  };

  const getMatchStatusText = (): string => {
    if (match.isAbandoned) return "Abandoned";
    if (match.winner === "player") return "Victory";
    if (match.winner === "ai") return "Defeat";
    if (match.winner === "tie") return "Tie";
    return "In Progress";
  };

  const getMatchStatusColor = (): string => {
    if (match.isAbandoned) return "text-warning";
    if (match.winner === "player") return "text-success";
    if (match.winner === "ai") return "text-error";
    if (match.winner === "tie") return "text-info";
    return "text-base-content";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Match Details</h2>
            <p className="text-sm text-base-content/60">Best of 3 vs AI</p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle" aria-label="Close detailed view">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Match Summary */}
          <div className="bg-card/30 border border-border rounded-lg p-4">
            <div className="grid grid-cols-3 items-center gap-4 mb-4">
              {/* Player Score */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <User size={16} className="text-primary" />
                  <span className="text-sm font-medium">You</span>
                </div>
                <div className="text-3xl font-bold">{match.playerScore}</div>
                {/* Win indicators */}
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full border-2 transition-all ${
                        i < match.playerScore ? "bg-success border-success" : "border-base-content/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* VS Divider */}
              <div className="text-center">
                <div className="text-base-content/40 text-sm font-medium mb-2">VS</div>
                <Trophy size={24} className="mx-auto text-warning" />
                <div className={`text-sm font-bold mt-2 ${getMatchStatusColor()}`} data-testid="match-status-display">
                  {getMatchStatusText()}
                </div>
              </div>

              {/* AI Score */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Bot size={16} className="text-secondary" />
                  <span className="text-sm font-medium">AI</span>
                </div>
                <div className="text-3xl font-bold">{match.aiScore}</div>
                {/* Win indicators */}
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full border-2 transition-all ${
                        i < match.aiScore ? "bg-success border-success" : "border-base-content/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Match Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Calendar size={16} />
                <div>
                  <div className="font-medium">Started</div>
                  <div>{formatTimestamp(match.startedAt)}</div>
                </div>
              </div>

              {match.completedAt && (
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <Clock size={16} />
                  <div>
                    <div className="font-medium">Duration</div>
                    <div>{formatDuration(match.startedAt, match.completedAt)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Round Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy size={18} />
              Round by Round
            </h3>

            <div className="space-y-3">
              {match.rounds.map((round: Round, index: number) => (
                <div
                  key={index}
                  className="bg-base-200 border border-border rounded-lg p-4 hover:bg-base-200/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary badge-sm">Round {round.roundNumber}</span>
                      <span className="text-xs text-base-content/60">{formatTimestamp(round.timestamp)}</span>
                    </div>
                    <div
                      className={`font-bold text-sm ${getResultColor(round.result.winner)}`}
                      data-testid={`round-${round.roundNumber}-result`}
                    >
                      {getResultText(round.result.winner)}
                    </div>
                  </div>

                  {/* Moves Display */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    {/* Player Move */}
                    <div className="text-center">
                      <div className="text-2xl mb-1">{getMoveEmoji(round.playerMove)}</div>
                      <div className="text-sm font-medium text-primary">You</div>
                      <div className="text-xs text-base-content/60 font-bold">
                        {getMoveDisplayText(round.playerMove)}
                      </div>
                    </div>

                    {/* VS */}
                    <div className="text-center">
                      <div className="text-base-content/40 text-sm font-medium">VS</div>
                    </div>

                    {/* AI Move */}
                    <div className="text-center">
                      <div className="text-2xl mb-1">{getMoveEmoji(round.aiMove)}</div>
                      <div className="text-sm font-medium text-secondary">AI</div>
                      <div className="text-xs text-base-content/60 font-bold">{getMoveDisplayText(round.aiMove)}</div>
                    </div>
                  </div>

                  {/* Round Result */}
                  <div className="mt-3 pt-3 border-t border-border text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        round.result.winner === "player"
                          ? "bg-success/20 text-success"
                          : round.result.winner === "ai"
                            ? "bg-error/20 text-error"
                            : "bg-warning/20 text-warning"
                      }`}
                    >
                      {round.result.winner === "player" && "🎉"}
                      {round.result.winner === "ai" && "😔"}
                      {round.result.winner === "tie" && "🤝"}
                      {getResultText(round.result.winner)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Progression */}
          {match.rounds.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Match Progression</h3>
              <div className="bg-card/30 border border-border rounded-lg p-4">
                <div className="flex justify-center gap-4">
                  {Array.from({ length: 3 }, (_, i) => {
                    const roundNumber = i + 1;
                    const round = match.rounds.find(r => r.roundNumber === roundNumber);
                    const isPlayed = !!round;
                    const isCurrent = roundNumber === match.currentRound && !match.completedAt;

                    return (
                      <div key={i} className="text-center">
                        <div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                            isPlayed
                              ? round?.result.winner === "player"
                                ? "bg-success border-success text-success-content"
                                : round?.result.winner === "ai"
                                  ? "bg-error border-error text-error-content"
                                  : "bg-warning border-warning text-warning-content"
                              : isCurrent
                                ? "border-primary text-primary animate-pulse"
                                : "border-base-content/20 text-base-content/40"
                          }`}
                        >
                          {isPlayed
                            ? round?.result.winner === "player"
                              ? "W"
                              : round?.result.winner === "ai"
                                ? "L"
                                : "T"
                            : roundNumber}
                        </div>
                        <div className="text-xs text-base-content/60 mt-1">Round {roundNumber}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Additional Match Info */}
          <div className="bg-base-200/50 border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 text-base-content/80">Match Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-base-content/60">Match ID:</span>
                <div className="font-mono text-xs break-all">{match.id}</div>
              </div>
              <div>
                <span className="text-base-content/60">Status:</span>
                <div className={`font-medium ${getMatchStatusColor()}`} data-testid="match-info-status">
                  {getMatchStatusText()}
                </div>
              </div>
              <div>
                <span className="text-base-content/60">Rounds Played:</span>
                <div>{match.rounds.length} of 3</div>
              </div>
              {match.completedAt && (
                <div>
                  <span className="text-base-content/60">Completed:</span>
                  <div>{formatTimestamp(match.completedAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
