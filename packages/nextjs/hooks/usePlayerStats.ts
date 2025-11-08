"use client";

import { useEffect, useState } from "react";
import { getLocalMatches } from "~~/lib/pinataStorage";

export const usePlayerStats = (address: string | undefined) => {
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    winRate: 0,
    totalWagered: 0,
  });

  useEffect(() => {
    if (!address) return;

    const matches = getLocalMatches();
    const userMatches = matches.filter(
      match => match.players.creator === address || match.players.joiner === address,
    );

    const wins = userMatches.filter(match => match.result.winner === address).length;
    const ties = userMatches.filter(match => match.result.winner === "tie").length;
    const losses = userMatches.length - wins - ties;
    const winRate = userMatches.length > 0 ? Math.round((wins / userMatches.length) * 100) : 0;
    const totalWagered = userMatches.reduce((sum, match) => sum + parseFloat(match.betAmount), 0);

    setStats({
      totalGames: userMatches.length,
      wins,
      losses,
      ties,
      winRate,
      totalWagered,
    });
  }, [address]);

  return stats;
};
