"use client";

import React from "react";
import { RankBadge } from "./RankBadge";

interface LeaderboardEntryData {
  position: number;
  address: string;
  displayName: string;
  wins: number;
  rank: string;
}

interface LeaderboardEntryProps {
  entry: LeaderboardEntryData;
  isCurrentUser?: boolean;
}

/**
 * LeaderboardEntry Component
 *
 * Displays a single entry in the leaderboard with position, name, rank, and wins.
 * Highlights the current user's entry.
 */
export const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({ entry, isCurrentUser = false }) => {
  // Special styling for top 3 positions
  const getPositionDisplay = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return `#${position}`;
  };

  const positionColor = (position: number) => {
    if (position === 1) return "text-yellow-400";
    if (position === 2) return "text-gray-300";
    if (position === 3) return "text-orange-400";
    return "text-base-content/70";
  };

  return (
    <div
      className={`
        flex items-center justify-between p-4 rounded-lg
        transition-all duration-200 hover:scale-[1.02]
        ${isCurrentUser ? "bg-primary/10 border-2 border-primary shadow-lg" : "bg-base-200 hover:bg-base-300"}
      `}
    >
      {/* Left: Position and Name */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Position */}
        <div
          className={`
            text-2xl font-bold w-12 text-center
            ${positionColor(entry.position)}
          `}
        >
          {getPositionDisplay(entry.position)}
        </div>

        {/* Display Name */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-base-content truncate">{entry.displayName}</span>
          {isCurrentUser && <span className="text-xs text-primary font-medium">You</span>}
        </div>
      </div>

      {/* Right: Rank and Wins */}
      <div className="flex items-center gap-4">
        {/* Wins */}
        <div className="text-right hidden sm:block">
          <div className="text-lg font-bold text-base-content">{entry.wins}</div>
          <div className="text-xs text-base-content/60">wins</div>
        </div>

        {/* Rank Badge */}
        <RankBadge rank={entry.rank} size="md" />
      </div>
    </div>
  );
};
