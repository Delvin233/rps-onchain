/**
 * Mixed Statistics System
 *
 * Provides backward compatibility for combining legacy single-round statistics
 * with new best-of-three match statistics. This ensures that players who have
 * both types of games get accurate combined statistics.
 *
 * Requirements: 7.3, 7.4, 7.5
 */

export interface LegacyStats {
  // Round-based statistics (legacy single-round games)
  ai_games: number;
  ai_wins: number;
  ai_ties: number;
  multiplayer_games: number;
  multiplayer_wins: number;
  multiplayer_ties: number;
}

export interface MatchStats {
  // Match-based statistics (new best-of-three games)
  ai_matches_played: number;
  ai_matches_won: number;
  ai_matches_lost: number;
  ai_matches_tied: number;
  ai_matches_abandoned: number;
}

export interface CombinedStats {
  // Combined statistics for display
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;

  // Breakdown by game type
  ai: {
    totalGames: number;
    wins: number;
    losses: number;
    ties: number;
    winRate: number;

    // Legacy round-based games
    legacy: {
      totalGames: number;
      wins: number;
      losses: number;
      ties: number;
      winRate: number;
    };

    // New match-based games
    matches: {
      totalMatches: number;
      wins: number;
      losses: number;
      ties: number;
      abandoned: number;
      winRate: number;
      completionRate: number;
    };
  };

  multiplayer: {
    totalGames: number;
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
  };
}

/**
 * Calculate combined statistics from legacy and match data
 *
 * This function properly weights and combines statistics from both
 * single-round legacy games and best-of-three matches to provide
 * accurate overall statistics.
 */
export function calculateMixedStatistics(legacyStats: LegacyStats, matchStats: MatchStats): CombinedStats {
  // Legacy AI statistics (single rounds)
  const legacyAiGames = legacyStats.ai_games || 0;
  const legacyAiWins = legacyStats.ai_wins || 0;
  const legacyAiTies = legacyStats.ai_ties || 0;
  const legacyAiLosses = legacyAiGames - legacyAiWins - legacyAiTies;

  // Match-based AI statistics (best-of-three)
  const matchesPlayed = matchStats.ai_matches_played || 0;
  const matchesWon = matchStats.ai_matches_won || 0;
  const matchesLost = matchStats.ai_matches_lost || 0;
  const matchesTied = matchStats.ai_matches_tied || 0;
  const matchesAbandoned = matchStats.ai_matches_abandoned || 0;

  // Multiplayer statistics (only legacy for now)
  const mpGames = legacyStats.multiplayer_games || 0;
  const mpWins = legacyStats.multiplayer_wins || 0;
  const mpTies = legacyStats.multiplayer_ties || 0;
  const mpLosses = mpGames - mpWins - mpTies;

  // Combined AI statistics
  // Note: We treat each match as equivalent to 1 game for overall statistics
  // This provides a fair comparison between legacy single-round and new match-based games
  const totalAiGames = legacyAiGames + matchesPlayed;
  const totalAiWins = legacyAiWins + matchesWon;
  const totalAiLosses = legacyAiLosses + matchesLost;
  const totalAiTies = legacyAiTies + matchesTied;

  // Overall combined statistics
  const totalGames = totalAiGames + mpGames;
  const totalWins = totalAiWins + mpWins;
  const totalLosses = totalAiLosses + mpLosses;
  const totalTies = totalAiTies + mpTies;

  // Calculate win rates with proper handling of zero games
  const overallWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const aiWinRate = totalAiGames > 0 ? Math.round((totalAiWins / totalAiGames) * 100) : 0;
  const legacyAiWinRate = legacyAiGames > 0 ? Math.round((legacyAiWins / legacyAiGames) * 100) : 0;
  const matchWinRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
  const mpWinRate = mpGames > 0 ? Math.round((mpWins / mpGames) * 100) : 0;

  // Calculate completion rate for matches
  const totalMatchAttempts = matchesPlayed + matchesAbandoned;
  const completionRate = totalMatchAttempts > 0 ? Math.round((matchesPlayed / totalMatchAttempts) * 100) : 100;

  return {
    totalGames,
    wins: totalWins,
    losses: totalLosses,
    ties: totalTies,
    winRate: overallWinRate,

    ai: {
      totalGames: totalAiGames,
      wins: totalAiWins,
      losses: totalAiLosses,
      ties: totalAiTies,
      winRate: aiWinRate,

      legacy: {
        totalGames: legacyAiGames,
        wins: legacyAiWins,
        losses: legacyAiLosses,
        ties: legacyAiTies,
        winRate: legacyAiWinRate,
      },

      matches: {
        totalMatches: matchesPlayed,
        wins: matchesWon,
        losses: matchesLost,
        ties: matchesTied,
        abandoned: matchesAbandoned,
        winRate: matchWinRate,
        completionRate,
      },
    },

    multiplayer: {
      totalGames: mpGames,
      wins: mpWins,
      losses: mpLosses,
      ties: mpTies,
      winRate: mpWinRate,
    },
  };
}

/**
 * Determine the appropriate display format for mixed statistics
 *
 * This function helps UI components decide how to display statistics
 * based on what types of games the player has played.
 */
export function getStatisticsDisplayMode(stats: CombinedStats): {
  mode: "legacy-only" | "matches-only" | "mixed";
  showLegacyBreakdown: boolean;
  showMatchBreakdown: boolean;
  primaryStatistic: "legacy" | "matches" | "combined";
} {
  const hasLegacyGames = stats.ai.legacy.totalGames > 0;
  const hasMatches = stats.ai.matches.totalMatches > 0;

  if (hasLegacyGames && hasMatches) {
    return {
      mode: "mixed",
      showLegacyBreakdown: true,
      showMatchBreakdown: true,
      primaryStatistic: "combined",
    };
  } else if (hasMatches) {
    return {
      mode: "matches-only",
      showLegacyBreakdown: false,
      showMatchBreakdown: true,
      primaryStatistic: "matches",
    };
  } else {
    return {
      mode: "legacy-only",
      showLegacyBreakdown: true,
      showMatchBreakdown: false,
      primaryStatistic: "legacy",
    };
  }
}

/**
 * Calculate weighted win rate for ranking purposes
 *
 * This function provides a fair ranking system that considers both
 * legacy games and matches, with appropriate weighting to ensure
 * players aren't penalized for having played different game types.
 */
export function calculateWeightedWinRate(stats: CombinedStats): {
  weightedWinRate: number;
  totalWeight: number;
  breakdown: {
    legacyWeight: number;
    matchWeight: number;
    legacyContribution: number;
    matchContribution: number;
  };
} {
  const legacyGames = stats.ai.legacy.totalGames;
  const legacyWinRate = stats.ai.legacy.winRate;
  const matchGames = stats.ai.matches.totalMatches;
  const matchWinRate = stats.ai.matches.winRate;

  // Weight each game type by the number of games played
  // This ensures that players with more games have more influence on their ranking
  const legacyWeight = legacyGames;
  const matchWeight = matchGames;
  const totalWeight = legacyWeight + matchWeight;

  if (totalWeight === 0) {
    return {
      weightedWinRate: 0,
      totalWeight: 0,
      breakdown: {
        legacyWeight: 0,
        matchWeight: 0,
        legacyContribution: 0,
        matchContribution: 0,
      },
    };
  }

  // Calculate weighted contributions
  const legacyContribution = (legacyWeight / totalWeight) * legacyWinRate;
  const matchContribution = (matchWeight / totalWeight) * matchWinRate;
  const weightedWinRate = Math.round(legacyContribution + matchContribution);

  return {
    weightedWinRate,
    totalWeight,
    breakdown: {
      legacyWeight,
      matchWeight,
      legacyContribution: Math.round(legacyContribution),
      matchContribution: Math.round(matchContribution),
    },
  };
}

/**
 * Validate mixed statistics for consistency
 *
 * This function ensures that the combined statistics are mathematically
 * consistent and haven't been corrupted by data migration or calculation errors.
 */
export function validateMixedStatistics(stats: CombinedStats): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate overall totals match breakdown
  const expectedTotalGames = stats.ai.totalGames + stats.multiplayer.totalGames;
  if (stats.totalGames !== expectedTotalGames) {
    errors.push(`Total games mismatch: ${stats.totalGames} !== ${expectedTotalGames}`);
  }

  const expectedTotalWins = stats.ai.wins + stats.multiplayer.wins;
  if (stats.wins !== expectedTotalWins) {
    errors.push(`Total wins mismatch: ${stats.wins} !== ${expectedTotalWins}`);
  }

  // Validate AI breakdown
  const expectedAiGames = stats.ai.legacy.totalGames + stats.ai.matches.totalMatches;
  if (stats.ai.totalGames !== expectedAiGames) {
    errors.push(`AI games mismatch: ${stats.ai.totalGames} !== ${expectedAiGames}`);
  }

  const expectedAiWins = stats.ai.legacy.wins + stats.ai.matches.wins;
  if (stats.ai.wins !== expectedAiWins) {
    errors.push(`AI wins mismatch: ${stats.ai.wins} !== ${expectedAiWins}`);
  }

  // Validate win rates are within valid range
  const winRates = [
    stats.winRate,
    stats.ai.winRate,
    stats.ai.legacy.winRate,
    stats.ai.matches.winRate,
    stats.multiplayer.winRate,
  ];

  for (const rate of winRates) {
    if (rate < 0 || rate > 100) {
      errors.push(`Invalid win rate: ${rate} (must be 0-100)`);
    }
  }

  // Validate completion rate
  if (stats.ai.matches.completionRate < 0 || stats.ai.matches.completionRate > 100) {
    errors.push(`Invalid completion rate: ${stats.ai.matches.completionRate} (must be 0-100)`);
  }

  // Warnings for unusual patterns
  if (stats.ai.matches.abandoned > stats.ai.matches.totalMatches) {
    warnings.push("More abandoned matches than total matches - possible data inconsistency");
  }

  if (stats.ai.matches.totalMatches > 0 && stats.ai.matches.completionRate < 50) {
    warnings.push("Low completion rate detected - player may be abandoning matches frequently");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
