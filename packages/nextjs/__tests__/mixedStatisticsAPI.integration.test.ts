/**
 * Integration Tests for Mixed Statistics API
 *
 * Tests the mixed statistics calculation functionality to ensure
 * backward compatibility and proper response formatting.
 */
import { calculateMixedStatistics, getStatisticsDisplayMode, validateMixedStatistics } from "../lib/mixedStatistics";
import { describe, expect, it } from "vitest";

describe("Mixed Statistics API Integration", () => {
  it("should calculate mixed statistics for player with both legacy and match data", () => {
    // Simulate database response with both legacy and match data
    const legacyStats = {
      ai_games: 10,
      ai_wins: 6,
      ai_ties: 1,
      multiplayer_games: 5,
      multiplayer_wins: 2,
      multiplayer_ties: 1,
    };

    const matchStats = {
      ai_matches_played: 3,
      ai_matches_won: 2,
      ai_matches_lost: 1,
      ai_matches_tied: 0,
      ai_matches_abandoned: 1,
    };

    const stats = calculateMixedStatistics(legacyStats, matchStats);
    const displayMode = getStatisticsDisplayMode(stats);
    const validation = validateMixedStatistics(stats);

    // Should have mixed statistics structure
    expect(stats).toHaveProperty("totalGames");
    expect(stats).toHaveProperty("ai");
    expect(stats.ai).toHaveProperty("legacy");
    expect(stats.ai).toHaveProperty("matches");

    // Total games should be legacy AI + matches + multiplayer
    expect(stats.totalGames).toBe(10 + 3 + 5); // 18 total

    // AI breakdown should be correct
    expect(stats.ai.totalGames).toBe(13); // 10 legacy + 3 matches
    expect(stats.ai.legacy.totalGames).toBe(10);
    expect(stats.ai.matches.totalMatches).toBe(3);

    // Display mode should indicate mixed mode
    expect(displayMode.mode).toBe("mixed");
    expect(displayMode.showLegacyBreakdown).toBe(true);
    expect(displayMode.showMatchBreakdown).toBe(true);
    expect(displayMode.primaryStatistic).toBe("combined");

    // Should pass validation
    expect(validation.isValid).toBe(true);
  });

  it("should calculate legacy-only statistics for player with no matches", () => {
    // Simulate database response with only legacy data
    const legacyStats = {
      ai_games: 8,
      ai_wins: 5,
      ai_ties: 1,
      multiplayer_games: 2,
      multiplayer_wins: 1,
      multiplayer_ties: 0,
    };

    const matchStats = {
      ai_matches_played: 0,
      ai_matches_won: 0,
      ai_matches_lost: 0,
      ai_matches_tied: 0,
      ai_matches_abandoned: 0,
    };

    const stats = calculateMixedStatistics(legacyStats, matchStats);
    const displayMode = getStatisticsDisplayMode(stats);

    // Should show legacy-only mode
    expect(displayMode.mode).toBe("legacy-only");
    expect(displayMode.showLegacyBreakdown).toBe(true);
    expect(displayMode.showMatchBreakdown).toBe(false);
    expect(displayMode.primaryStatistic).toBe("legacy");

    // Match stats should be empty
    expect(stats.ai.matches.totalMatches).toBe(0);
    expect(stats.ai.matches.winRate).toBe(0);
    expect(stats.ai.matches.completionRate).toBe(100);
  });

  it("should calculate matches-only statistics for player with no legacy games", () => {
    // Simulate database response with only match data
    const legacyStats = {
      ai_games: 0,
      ai_wins: 0,
      ai_ties: 0,
      multiplayer_games: 0,
      multiplayer_wins: 0,
      multiplayer_ties: 0,
    };

    const matchStats = {
      ai_matches_played: 5,
      ai_matches_won: 3,
      ai_matches_lost: 2,
      ai_matches_tied: 0,
      ai_matches_abandoned: 2,
    };

    const stats = calculateMixedStatistics(legacyStats, matchStats);
    const displayMode = getStatisticsDisplayMode(stats);

    // Should show matches-only mode
    expect(displayMode.mode).toBe("matches-only");
    expect(displayMode.showLegacyBreakdown).toBe(false);
    expect(displayMode.showMatchBreakdown).toBe(true);
    expect(displayMode.primaryStatistic).toBe("matches");

    // Total games should equal matches
    expect(stats.totalGames).toBe(5);
    expect(stats.ai.totalGames).toBe(5);

    // Legacy stats should be empty
    expect(stats.ai.legacy.totalGames).toBe(0);
    expect(stats.ai.legacy.winRate).toBe(0);

    // Completion rate should account for abandoned matches
    const expectedCompletionRate = Math.round((5 / (5 + 2)) * 100); // 71%
    expect(stats.ai.matches.completionRate).toBe(expectedCompletionRate);
  });

  it("should handle empty statistics correctly", () => {
    // Simulate database response with no data
    const legacyStats = {
      ai_games: 0,
      ai_wins: 0,
      ai_ties: 0,
      multiplayer_games: 0,
      multiplayer_wins: 0,
      multiplayer_ties: 0,
    };

    const matchStats = {
      ai_matches_played: 0,
      ai_matches_won: 0,
      ai_matches_lost: 0,
      ai_matches_tied: 0,
      ai_matches_abandoned: 0,
    };

    const stats = calculateMixedStatistics(legacyStats, matchStats);
    const validation = validateMixedStatistics(stats);

    // Should have all zero values
    expect(stats.totalGames).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.ai.totalGames).toBe(0);
    expect(stats.ai.winRate).toBe(0);
    expect(stats.ai.matches.completionRate).toBe(100); // 100% when no matches

    // Should pass validation
    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toHaveLength(0);
  });

  it("should handle edge cases with high abandonment rates", () => {
    // Simulate player with high abandonment rate
    const legacyStats = {
      ai_games: 5,
      ai_wins: 2,
      ai_ties: 1,
      multiplayer_games: 0,
      multiplayer_wins: 0,
      multiplayer_ties: 0,
    };

    const matchStats = {
      ai_matches_played: 2,
      ai_matches_won: 1,
      ai_matches_lost: 1,
      ai_matches_tied: 0,
      ai_matches_abandoned: 8, // High abandonment
    };

    const stats = calculateMixedStatistics(legacyStats, matchStats);
    const validation = validateMixedStatistics(stats);

    // Should still calculate correctly
    expect(stats.totalGames).toBe(7); // 5 legacy + 2 matches
    expect(stats.ai.matches.completionRate).toBe(20); // 2/(2+8) = 20%

    // Should have warnings about high abandonment
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.warnings.some(w => w.includes("Low completion rate"))).toBe(true);
  });

  it("should validate statistics and detect inconsistencies", () => {
    // Create inconsistent statistics manually
    const stats = {
      totalGames: 10,
      wins: 5,
      losses: 3,
      ties: 2,
      winRate: 50,
      ai: {
        totalGames: 15, // This is inconsistent - more than total
        wins: 4,
        losses: 1,
        ties: 1,
        winRate: 67,
        legacy: {
          totalGames: 8,
          wins: 4,
          losses: 3,
          ties: 1,
          winRate: 50,
        },
        matches: {
          totalMatches: 2,
          wins: 1,
          losses: 1,
          ties: 0,
          abandoned: 5,
          winRate: 50,
          completionRate: 29,
        },
      },
      multiplayer: {
        totalGames: 2,
        wins: 1,
        losses: 1,
        ties: 0,
        winRate: 50,
      },
    };

    const validation = validateMixedStatistics(stats);

    // Should detect inconsistencies
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.warnings.length).toBeGreaterThan(0);
  });
});

describe("Mixed Statistics Calculation Consistency", () => {
  it("should produce consistent results across multiple calculations", () => {
    const legacyStats = {
      ai_games: 10,
      ai_wins: 6,
      ai_ties: 1,
      multiplayer_games: 5,
      multiplayer_wins: 2,
      multiplayer_ties: 1,
    };

    const matchStats = {
      ai_matches_played: 3,
      ai_matches_won: 2,
      ai_matches_lost: 1,
      ai_matches_tied: 0,
      ai_matches_abandoned: 1,
    };

    // Calculate multiple times
    const result1 = calculateMixedStatistics(legacyStats, matchStats);
    const result2 = calculateMixedStatistics(legacyStats, matchStats);
    const result3 = calculateMixedStatistics(legacyStats, matchStats);

    // All results should be identical
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);

    // Verify key calculations
    expect(result1.totalGames).toBe(18); // 10 + 3 + 5
    expect(result1.wins).toBe(10); // 6 + 2 + 2
    expect(result1.ai.totalGames).toBe(13); // 10 + 3
    expect(result1.ai.wins).toBe(8); // 6 + 2

    // Win rates should be calculated correctly
    const expectedOverallWinRate = Math.round((10 / 18) * 100); // 56%
    const expectedAiWinRate = Math.round((8 / 13) * 100); // 62%

    expect(result1.winRate).toBe(expectedOverallWinRate);
    expect(result1.ai.winRate).toBe(expectedAiWinRate);
  });

  it("should handle API response format correctly", () => {
    const legacyStats = {
      ai_games: 5,
      ai_wins: 3,
      ai_ties: 0,
      multiplayer_games: 2,
      multiplayer_wins: 1,
      multiplayer_ties: 1,
    };

    const matchStats = {
      ai_matches_played: 2,
      ai_matches_won: 1,
      ai_matches_lost: 1,
      ai_matches_tied: 0,
      ai_matches_abandoned: 0,
    };

    const stats = calculateMixedStatistics(legacyStats, matchStats);
    const displayMode = getStatisticsDisplayMode(stats);
    const validation = validateMixedStatistics(stats);

    // Create API response format
    const apiResponse = {
      ...stats,
      _metadata: {
        displayMode: displayMode.mode,
        showLegacyBreakdown: displayMode.showLegacyBreakdown,
        showMatchBreakdown: displayMode.showMatchBreakdown,
        primaryStatistic: displayMode.primaryStatistic,
        hasLegacyGames: stats.ai.legacy.totalGames > 0,
        hasMatches: stats.ai.matches.totalMatches > 0,
        validationPassed: validation.isValid,
        validationWarnings: validation.warnings,
      },
    };

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
    expect(apiResponse._metadata.hasLegacyGames).toBe(true);
    expect(apiResponse._metadata.hasMatches).toBe(true);
    expect(apiResponse._metadata.displayMode).toBe("mixed");
    expect(apiResponse._metadata.validationPassed).toBe(true);

    // AI section should have both legacy and matches
    expect(apiResponse.ai).toHaveProperty("legacy");
    expect(apiResponse.ai).toHaveProperty("matches");
    expect(apiResponse.ai.legacy).toHaveProperty("totalGames");
    expect(apiResponse.ai.matches).toHaveProperty("totalMatches");
  });
});
