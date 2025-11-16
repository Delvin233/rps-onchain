"use client";

import { useQuery } from "@tanstack/react-query";

const defaultStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  ties: 0,
  winRate: 0,
  ai: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    winRate: 0,
  },
  multiplayer: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    winRate: 0,
  },
};

export const usePlayerStats = (address: string | undefined) => {
  const {
    data: stats = defaultStats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["player-stats", address],
    queryFn: async () => {
      if (!address) return defaultStats;
      const response = await fetch(`/api/stats-fast?address=${address}`);
      const data = await response.json();
      return data.stats || defaultStats;
    },
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return { ...stats, isLoading, refetch };
};
