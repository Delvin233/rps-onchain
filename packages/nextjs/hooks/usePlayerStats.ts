"use client";

import { useEffect, useState } from "react";

export const usePlayerStats = (address: string | undefined) => {
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    winRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/history?address=${address}`);
      const data = await response.json();

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return { ...stats, isLoading, refetch: calculateStats };
};
