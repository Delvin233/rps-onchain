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
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const matches = getLocalMatches();
    const userMatches = matches.filter(
      match => match.players?.creator === address || match.players?.joiner === address || match.player === address,
    );

    const wins = userMatches.filter(match =>
      typeof match.result === "object" ? match.result.winner === address : match.result === "win",
    ).length;
    const ties = userMatches.filter(match =>
      typeof match.result === "object" ? match.result.winner === "tie" : match.result === "tie",
    ).length;
    const losses = userMatches.length - wins - ties;
    const winRate = userMatches.length > 0 ? Math.round((wins / userMatches.length) * 100) : 0;
    const totalWagered = userMatches.reduce((sum, match) => sum + parseFloat(match.betAmount || "0"), 0);

    setStats({
      totalGames: userMatches.length,
      wins,
      losses,
      ties,
      winRate,
      totalWagered,
    });
    setIsLoading(false);
  };

  useEffect(() => {
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return { ...stats, isLoading, refetch: calculateStats };
};
