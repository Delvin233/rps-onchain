"use client";

import React from "react";
import { getRankColor, hasGradient } from "~~/lib/ranks";

interface RankBadgeProps {
  rank: string;
  wins?: number;
  size?: "sm" | "md" | "lg";
  showWins?: boolean;
  className?: string;
}

/**
 * RankBadge Component
 *
 * Displays a player's rank with color coding and optional gradient effects.
 * Supports multiple sizes and optional win count display.
 */
export const RankBadge: React.FC<RankBadgeProps> = ({ rank, wins, size = "md", showWins = false, className = "" }) => {
  const color = getRankColor(rank);
  const isGradient = hasGradient(rank);

  // Size configurations
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const fontSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Base styles
  const baseStyles = "inline-flex items-center gap-2 rounded-lg font-bold transition-all duration-200";

  // Apply gradient or solid color
  const colorStyles = isGradient
    ? {
        background: color,
        color: "#FFFFFF",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }
    : {
        backgroundColor: color,
        color: "#FFFFFF",
      };

  return (
    <div className={`${baseStyles} ${sizeClasses[size]} ${className}`} style={colorStyles}>
      <span className={fontSizeClasses[size]}>{rank}</span>
      {showWins && wins !== undefined && (
        <span className={`${fontSizeClasses[size]} opacity-90`}>
          ({wins} {wins === 1 ? "win" : "wins"})
        </span>
      )}
    </div>
  );
};
