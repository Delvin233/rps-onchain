/**
 * Property-Based Tests for Mixed Statistics Calculation
 *
 * Tests Property 16: Mixed Statistics Calculation
 * Validates Requirements 7.5 - Backward compatibility with legacy statistics
 *
 * These tests ensure that the mixed statistics system correctly combines
 * legacy single-round games with new best-of-three matches while maintaining
 * mathematical consistency and providing accurate win rates.
 */
import {
  type CombinedStats,
  type LegacyStats,
  type MatchStats,
  calculateMixedStatistics,
  calculateWeightedWinRate,
  getStatisticsDisplayMode,
  validateMixedStatistics,
} from "../lib/mixedStatistics";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

// Generators for test data - defined at module level for reuse
const legacyStatsArb = fc
  .record({
    ai_games: fc.integer({ min: 0, max: 1000 }),
    ai_wins: fc.integer({ min: 0, max: 1000 }),
    ai_ties: fc.integer({ min: 0, max: 1000 }),
    multiplayer_games: fc.integer({ min: 0, max: 1000 }),
    multiplayer_wins: fc.integer({ min: 0, max: 1000 }),
    multiplayer_ties: fc.integer({ min: 0, max: 1000 }),
  })
  .filter(
    stats =>
      stats.ai_wins + stats.ai_ties <= stats.ai_games &&
      stats.multiplayer_wins + stats.multiplayer_ties <= stats.multiplayer_games,
  );

const matchStatsArb = fc
  .record({
    ai_matches_played: fc.integer({ min: 0, max: 500 }),
    ai_matches_won: fc.integer({ min: 0, max: 500 }),
    ai_matches_lost: fc.integer({ min: 0, max: 500 }),
    ai_matches_tied: fc.integer({ min: 0, max: 500 }),
    ai_matches_abandoned: fc.integer({ min: 0, max: 100 }),
  })
  .filter(stats => stats.ai_matches_won + stats.ai_matches_lost + stats.ai_matches_tied <= stats.ai_matches_played);

describe("Property 16: Mixed Statistics Calculation", () => {
  it("Property 16.1: Total games calculation is mathematically consistent", () => {
    fc.assert(
      fc.property(legacyStatsArb, matchStatsArb, (legacyStats, matchStats) => {
        const result = calculateMixedStatistics(legacyStats, matchStats);

        // Total games should equal sum of all game types
        const expectedTotalGames = legacyStats.ai_games + matchStats.ai_matches_played + legacyStats.multiplayer_games;
        expect(result.totalGames).toBe(expectedTotalGames);

        // AI total should equal legacy + matches
        const expectedAiTotal = legacyStats.ai_games + matchStats.ai_matches_played;
        expect(result.ai.totalGames).toBe(expectedAiTotal);

        // Breakdown should match inputs
        expect(result.ai.legacy.totalGames).toBe(legacyStats.ai_games);
        expect(result.ai.matches.totalMatches).toBe(matchStats.ai_matches_played);
        expect(result.multiplayer.totalGames).toBe(legacyStats.multiplayer_games);
      }),
      { numRuns: 100 },
    );
  });

  it("Property 16.2: Win/loss/tie calculations preserve totals", () => {
    fc.assert(
      fc.property(legacyStatsArb, matchStatsArb, (legacyStats, matchStats) => {
        const result = calculateMixedStatistics(legacyStats, matchStats);

        // Total wins should equal sum of all wins
        const expectedTotalWins = legacyStats.ai_wins + matchStats.ai_matches_won + legacyStats.multiplayer_wins;
        expect(result.wins).toBe(expectedTotalWins);

        // Total ties should equal sum of all ties
        const expectedTotalTies = legacyStats.ai_ties + matchStats.ai_matches_tied + legacyStats.multiplayer_ties;
        expect(result.ties).toBe(expectedTotalTies);

        // AI breakdown should be consistent
        expect(result.ai.wins).toBe(legacyStats.ai_wins + matchStats.ai_matches_won);
        expect(result.ai.ties).toBe(legacyStats.ai_ties + matchStats.ai_matches_tied);

        // Legacy breakdown should match input
        expect(result.ai.legacy.wins).toBe(legacyStats.ai_wins);
        expect(result.ai.legacy.ties).toBe(legacyStats.ai_ties);
        expect(result.ai.legacy.losses).toBe(legacyStats.ai_games - legacyStats.ai_wins - legacyStats.ai_ties);

        // Match breakdown should match input
        expect(result.ai.matches.wins).toBe(matchStats.ai_matches_won);
        expect(result.ai.matches.ties).toBe(matchStats.ai_matches_tied);
        expect(result.ai.matches.losses).toBe(matchStats.ai_matches_lost);
      }),
      { numRuns: 100 },
    );
  });

  it("Property 16.3: Win rates are calculated correctly and within valid range", () => {
    fc.assert(
      fc.property(legacyStatsArb, matchStatsArb, (legacyStats, matchStats) => {
        const result = calculateMixedStatistics(legacyStats, matchStats);

        // All win rates should be between 0 and 100
        expect(result.winRate).toBeGreaterThanOrEqual(0);
        expect(result.winRate).toBeLessThanOrEqual(100);
        expect(result.ai.winRate).toBeGreaterThanOrEqual(0);
        expect(result.ai.winRate).toBeLessThanOrEqual(100);
        expect(result.ai.legacy.winRate).toBeGreaterThanOrEqual(0);
        expect(result.ai.legacy.winRate).toBeLessThanOrEqual(100);
        expect(result.ai.matches.winRate).toBeGreaterThanOrEqual(0);
        expect(result.ai.matches.winRate).toBeLessThanOrEqual(100);
        expect(result.multiplayer.winRate).toBeGreaterThanOrEqual(0);
        expect(result.multiplayer.winRate).toBeLessThanOrEqual(100);

        // Win rates should be 0 when no games played
        if (result.totalGames === 0) {
          expect(result.winRate).toBe(0);
        }
        if (result.ai.totalGames === 0) {
          expect(result.ai.winRate).toBe(0);
        }
        if (result.ai.legacy.totalGames === 0) {
          expect(result.ai.legacy.winRate).toBe(0);
        }
        if (result.ai.matches.totalMatches === 0) {
          expect(result.ai.matches.winRate).toBe(0);
        }
        if (result.multiplayer.totalGames === 0) {
          expect(result.multiplayer.winRate).toBe(0);
        }

        // Win rates should be calculated correctly when games exist
        if (result.totalGames > 0) {
          const expectedWinRate = Math.round((result.wins / result.totalGames) * 100);
          expect(result.winRate).toBe(expectedWinRate);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("Property 16.4: Completion rate calculation is accurate", () => {
    fc.assert(
      fc.property(matchStatsArb, matchStats => {
        const legacyStats: LegacyStats = {
          ai_games: 0,
          ai_wins: 0,
          ai_ties: 0,
          multiplayer_games: 0,
          multiplayer_wins: 0,
          multiplayer_ties: 0,
        };

        const result = calculateMixedStatistics(legacyStats, matchStats);

        // Completion rate should be between 0 and 100
        expect(result.ai.matches.completionRate).toBeGreaterThanOrEqual(0);
        expect(result.ai.matches.completionRate).toBeLessThanOrEqual(100);

        // Completion rate should be 100% when no abandoned matches
        if (matchStats.ai_matches_abandoned === 0) {
          expect(result.ai.matches.completionRate).toBe(100);
        }

        // Completion rate should be calculated correctly
        const totalAttempts = matchStats.ai_matches_played + matchStats.ai_matches_abandoned;
        if (totalAttempts > 0) {
          const expectedRate = Math.round((matchStats.ai_matches_played / totalAttempts) * 100);
          expect(result.ai.matches.completionRate).toBe(expectedRate);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("Property 16.5: Display mode detection works correctly", () => {
    fc.assert(
      fc.property(legacyStatsArb, matchStatsArb, (legacyStats, matchStats) => {
        const result = calculateMixedStatistics(legacyStats, matchStats);
        const displayMode = getStatisticsDisplayMode(result);

        const hasLegacy = legacyStats.ai_games > 0;
        const hasMatches = matchStats.ai_matches_played > 0;

        if (hasLegacy && hasMatches) {
          expect(displayMode.mode).toBe("mixed");
          expect(displayMode.showLegacyBreakdown).toBe(true);
          expect(displayMode.showMatchBreakdown).toBe(true);
          expect(displayMode.primaryStatistic).toBe("combined");
        } else if (hasMatches) {
          expect(displayMode.mode).toBe("matches-only");
          expect(displayMode.showLegacyBreakdown).toBe(false);
          expect(displayMode.showMatchBreakdown).toBe(true);
          expect(displayMode.primaryStatistic).toBe("matches");
        } else {
          expect(displayMode.mode).toBe("legacy-only");
          expect(displayMode.showLegacyBreakdown).toBe(true);
          expect(displayMode.showMatchBreakdown).toBe(false);
          expect(displayMode.primaryStatistic).toBe("legacy");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("Property 16.6: Weighted win rate calculation is fair and consistent", () => {
    fc.assert(
      fc.property(legacyStatsArb, matchStatsArb, (legacyStats, matchStats) => {
        const result = calculateMixedStatistics(legacyStats, matchStats);
        const weighted = calculateWeightedWinRate(result);

        // Weighted win rate should be between 0 and 100
        expect(weighted.weightedWinRate).toBeGreaterThanOrEqual(0);
        expect(weighted.weightedWinRate).toBeLessThanOrEqual(100);

        // Total weight should equal total games
        const expectedWeight = legacyStats.ai_games + matchStats.ai_matches_played;
        expect(weighted.totalWeight).toBe(expectedWeight);

        // Breakdown weights should match game counts
        expect(weighted.breakdown.legacyWeight).toBe(legacyStats.ai_games);
        expect(weighted.breakdown.matchWeight).toBe(matchStats.ai_matches_played);

        // If only one type of game, weighted rate should match that type's rate
        if (legacyStats.ai_games > 0 && matchStats.ai_matches_played === 0) {
          expect(weighted.weightedWinRate).toBe(result.ai.legacy.winRate);
        }
        if (legacyStats.ai_games === 0 && matchStats.ai_matches_played > 0) {
          expect(weighted.weightedWinRate).toBe(result.ai.matches.winRate);
        }

        // Contributions should sum to weighted win rate (within rounding)
        const totalContribution = weighted.breakdown.legacyContribution + weighted.breakdown.matchContribution;
        expect(Math.abs(totalContribution - weighted.weightedWinRate)).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  it("Property 16.7: Statistics validation catches inconsistencies", () => {
    fc.assert(
      fc.property(legacyStatsArb, matchStatsArb, (legacyStats, matchStats) => {
        const result = calculateMixedStatistics(legacyStats, matchStats);
        const validation = validateMixedStatistics(result);

        // Valid statistics should pass validation
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);

        // Test with corrupted data
        const corruptedStats: CombinedStats = {
          ...result,
          totalGames: result.totalGames + 1, // Introduce inconsistency
        };

        const corruptedValidation = validateMixedStatistics(corruptedStats);
        expect(corruptedValidation.isValid).toBe(false);
        expect(corruptedValidation.errors.length).toBeGreaterThan(0);
      }),
      { numRuns: 50 },
    );
  });

  it("Property 16.8: Edge cases are handled correctly", () => {
    // Test with all zeros
    const emptyLegacy: LegacyStats = {
      ai_games: 0,
      ai_wins: 0,
      ai_ties: 0,
      multiplayer_games: 0,
      multiplayer_wins: 0,
      multiplayer_ties: 0,
    };

    const emptyMatches: MatchStats = {
      ai_matches_played: 0,
      ai_matches_won: 0,
      ai_matches_lost: 0,
      ai_matches_tied: 0,
      ai_matches_abandoned: 0,
    };

    const emptyResult = calculateMixedStatistics(emptyLegacy, emptyMatches);
    expect(emptyResult.totalGames).toBe(0);
    expect(emptyResult.winRate).toBe(0);
    expect(emptyResult.ai.matches.completionRate).toBe(100);

    const emptyValidation = validateMixedStatistics(emptyResult);
    expect(emptyValidation.isValid).toBe(true);

    // Test with maximum values
    const maxLegacy: LegacyStats = {
      ai_games: 1000,
      ai_wins: 1000,
      ai_ties: 0,
      multiplayer_games: 1000,
      multiplayer_wins: 1000,
      multiplayer_ties: 0,
    };

    const maxMatches: MatchStats = {
      ai_matches_played: 500,
      ai_matches_won: 500,
      ai_matches_lost: 0,
      ai_matches_tied: 0,
      ai_matches_abandoned: 0,
    };

    const maxResult = calculateMixedStatistics(maxLegacy, maxMatches);
    expect(maxResult.winRate).toBe(100);
    expect(maxResult.ai.winRate).toBe(100);
    expect(maxResult.ai.matches.completionRate).toBe(100);

    const maxValidation = validateMixedStatistics(maxResult);
    expect(maxValidation.isValid).toBe(true);
  });

  it("Property 16.9: Backward compatibility preserves legacy behavior", () => {
    fc.assert(
      fc.property(legacyStatsArb, legacyStats => {
        // Test with only legacy stats (no matches)
        const emptyMatches: MatchStats = {
          ai_matches_played: 0,
          ai_matches_won: 0,
          ai_matches_lost: 0,
          ai_matches_tied: 0,
          ai_matches_abandoned: 0,
        };

        const result = calculateMixedStatistics(legacyStats, emptyMatches);

        // Overall stats should match legacy stats
        const expectedTotal = legacyStats.ai_games + legacyStats.multiplayer_games;
        const expectedWins = legacyStats.ai_wins + legacyStats.multiplayer_wins;
        const expectedTies = legacyStats.ai_ties + legacyStats.multiplayer_ties;

        expect(result.totalGames).toBe(expectedTotal);
        expect(result.wins).toBe(expectedWins);
        expect(result.ties).toBe(expectedTies);

        // AI stats should match legacy AI stats
        expect(result.ai.totalGames).toBe(legacyStats.ai_games);
        expect(result.ai.wins).toBe(legacyStats.ai_wins);
        expect(result.ai.ties).toBe(legacyStats.ai_ties);

        // Legacy breakdown should be identical to input
        expect(result.ai.legacy.totalGames).toBe(legacyStats.ai_games);
        expect(result.ai.legacy.wins).toBe(legacyStats.ai_wins);
        expect(result.ai.legacy.ties).toBe(legacyStats.ai_ties);

        // Match stats should be empty
        expect(result.ai.matches.totalMatches).toBe(0);
        expect(result.ai.matches.wins).toBe(0);
        expect(result.ai.matches.completionRate).toBe(100);

        // Display mode should be legacy-only
        const displayMode = getStatisticsDisplayMode(result);
        expect(displayMode.mode).toBe("legacy-only");
        expect(displayMode.primaryStatistic).toBe("legacy");
      }),
      { numRuns: 100 },
    );
  });

  it("Property 16.10: Match-only statistics work correctly", () => {
    fc.assert(
      fc.property(matchStatsArb, matchStats => {
        // Test with only match stats (no legacy)
        const emptyLegacy: LegacyStats = {
          ai_games: 0,
          ai_wins: 0,
          ai_ties: 0,
          multiplayer_games: 0,
          multiplayer_wins: 0,
          multiplayer_ties: 0,
        };

        const result = calculateMixedStatistics(emptyLegacy, matchStats);

        // Overall stats should match match stats
        expect(result.totalGames).toBe(matchStats.ai_matches_played);
        expect(result.wins).toBe(matchStats.ai_matches_won);
        expect(result.ties).toBe(matchStats.ai_matches_tied);

        // AI stats should match match stats
        expect(result.ai.totalGames).toBe(matchStats.ai_matches_played);
        expect(result.ai.wins).toBe(matchStats.ai_matches_won);
        expect(result.ai.ties).toBe(matchStats.ai_matches_tied);

        // Legacy breakdown should be empty
        expect(result.ai.legacy.totalGames).toBe(0);
        expect(result.ai.legacy.wins).toBe(0);
        expect(result.ai.legacy.winRate).toBe(0);

        // Match stats should match input
        expect(result.ai.matches.totalMatches).toBe(matchStats.ai_matches_played);
        expect(result.ai.matches.wins).toBe(matchStats.ai_matches_won);
        expect(result.ai.matches.losses).toBe(matchStats.ai_matches_lost);
        expect(result.ai.matches.ties).toBe(matchStats.ai_matches_tied);
        expect(result.ai.matches.abandoned).toBe(matchStats.ai_matches_abandoned);

        // Display mode should be matches-only if matches exist
        const displayMode = getStatisticsDisplayMode(result);
        if (matchStats.ai_matches_played > 0) {
          expect(displayMode.mode).toBe("matches-only");
          expect(displayMode.primaryStatistic).toBe("matches");
        } else {
          expect(displayMode.mode).toBe("legacy-only");
          expect(displayMode.primaryStatistic).toBe("legacy");
        }
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Helper function to create test statistics that mirror the API response format
 */
function createTestStatsFromMixed(mixedStats: CombinedStats) {
  return {
    ...mixedStats,
    _metadata: {
      displayMode: getStatisticsDisplayMode(mixedStats).mode,
      showLegacyBreakdown: getStatisticsDisplayMode(mixedStats).showLegacyBreakdown,
      showMatchBreakdown: getStatisticsDisplayMode(mixedStats).showMatchBreakdown,
      primaryStatistic: getStatisticsDisplayMode(mixedStats).primaryStatistic,
      hasLegacyGames: mixedStats.ai.legacy.totalGames > 0,
      hasMatches: mixedStats.ai.matches.totalMatches > 0,
      validationPassed: validateMixedStatistics(mixedStats).isValid,
      validationWarnings: validateMixedStatistics(mixedStats).warnings,
    },
  };
}

describe("Mixed Statistics API Integration", () => {
  it("should format statistics correctly for API response", () => {
    fc.assert(
      fc.property(legacyStatsArb, matchStatsArb, (legacyStats, matchStats) => {
        const mixedStats = calculateMixedStatistics(legacyStats, matchStats);
        const apiResponse = createTestStatsFromMixed(mixedStats);

        // Should have all required fields
        expect(apiResponse).toHaveProperty("totalGames");
        expect(apiResponse).toHaveProperty("wins");
        expect(apiResponse).toHaveProperty("losses");
        expect(apiResponse).toHaveProperty("ties");
        expect(apiResponse).toHaveProperty("winRate");
        expect(apiResponse).toHaveProperty("ai");
        expect(apiResponse).toHaveProperty("multiplayer");
        expect(apiResponse).toHaveProperty("_metadata");

        // Metadata should be consistent
        expect(apiResponse._metadata.hasLegacyGames).toBe(legacyStats.ai_games > 0);
        expect(apiResponse._metadata.hasMatches).toBe(matchStats.ai_matches_played > 0);
        expect(apiResponse._metadata.validationPassed).toBe(true);

        // AI section should have both legacy and matches
        expect(apiResponse.ai).toHaveProperty("legacy");
        expect(apiResponse.ai).toHaveProperty("matches");
        expect(apiResponse.ai.legacy).toHaveProperty("totalGames");
        expect(apiResponse.ai.matches).toHaveProperty("totalMatches");
      }),
      { numRuns: 50 },
    );
  });
});
