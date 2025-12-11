/**
 * Property-Based Tests for AI Match Abandonment Pattern Tracking
 *
 * **Feature: best-of-three-ai-matches, Property 8: Abandonment Pattern Tracking**
 *
 * Tests that the system accurately tracks abandonment patterns for players
 * who abandon multiple matches and applies appropriate restrictions.
 */
import { aiMatchManager } from "../lib/aiMatchManager";
import { MatchStatus } from "../types/aiMatch";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Redis is mocked globally in vitest.setup.ts

// Mock turso module to avoid import issues
vi.mock("../lib/turso", () => ({
  turso: {
    execute: vi.fn(),
    batch: vi.fn(),
  },
}));

// Mock storage functions
vi.mock("../lib/aiMatchStorage", async importOriginal => {
  const actual = await importOriginal<typeof import("../lib/aiMatchStorage")>();
  return {
    ...actual,
    saveActiveMatchToRedis: vi.fn(),
    getActiveMatchFromRedis: vi.fn(),
    getActiveMatchForPlayer: vi.fn(),
    completeMatch: vi.fn(),
    getPlayerMatchStats: vi.fn(),
    cleanupExpiredMatches: vi.fn(),
    deleteOldAbandonedMatches: vi.fn(),
    getAllActiveMatches: vi.fn().mockResolvedValue([]),
  };
});

// Mock the AI Match Metrics to prevent Redis connection issues
vi.mock("../lib/aiMatchMetrics", () => ({
  aiMatchMetrics: {
    updateActiveMatchCount: vi.fn(),
    recordApiResponseTime: vi.fn(),
    recordDatabaseOperationTime: vi.fn(),
    incrementErrorCount: vi.fn(),
    getMetrics: vi.fn().mockResolvedValue({
      activeMatchCount: 0,
      completionRate: 0,
      averageMatchDuration: 0,
      abandonmentRate: 0,
      totalMatchesCompleted: 0,
      totalMatchesAbandoned: 0,
      recentApiResponseTimes: { start: [], playRound: [], status: [], abandon: [] },
      databaseOperationTimes: { redis: [], turso: [] },
      errorRates: { apiErrors: 0, databaseErrors: 0, redisErrors: 0 },
    }),
  },
  withDatabaseMetricsTracking: vi.fn((operation, database, fn) => fn),
}));

describe("AI Match Abandonment Pattern Tracking Properties", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mocks for storage functions
    const {
      getActiveMatchForPlayer,
      getPlayerMatchStats,
      saveActiveMatchToRedis,
      getAllActiveMatches,
      completeMatch,
      cleanupExpiredMatches,
      deleteOldAbandonedMatches,
    } = await import("../lib/aiMatchStorage");

    vi.mocked(getActiveMatchForPlayer).mockResolvedValue(null);
    vi.mocked(saveActiveMatchToRedis).mockResolvedValue(undefined);
    vi.mocked(getAllActiveMatches).mockResolvedValue([]);
    vi.mocked(completeMatch).mockResolvedValue(undefined);
    vi.mocked(cleanupExpiredMatches).mockResolvedValue(0);
    vi.mocked(deleteOldAbandonedMatches).mockResolvedValue(0);
    vi.mocked(getPlayerMatchStats).mockResolvedValue({
      ai_matches_played: 0,
      ai_matches_won: 0,
      ai_matches_lost: 0,
      ai_matches_tied: 0,
      ai_matches_abandoned: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 8: Abandonment Pattern Tracking
   * For any player who abandons multiple matches, the system should increment
   * their abandonment count accurately
   */
  describe("Property 8: Abandonment Pattern Tracking", () => {
    it("should accurately track abandonment patterns for players with low abandonment rates", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            completedMatches: fc.integer({ min: 5, max: 20 }),
            abandonedMatches: fc.integer({ min: 0, max: 2 }), // Low abandonment count
          }),
          async ({ playerId, completedMatches, abandonedMatches }) => {
            // Mock player stats with low abandonment rate
            const { getPlayerMatchStats } = await import("../lib/aiMatchStorage");
            vi.mocked(getPlayerMatchStats).mockResolvedValue({
              ai_matches_played: completedMatches,
              ai_matches_won: Math.floor(completedMatches * 0.6),
              ai_matches_lost: Math.floor(completedMatches * 0.3),
              ai_matches_tied: completedMatches - Math.floor(completedMatches * 0.9),
              ai_matches_abandoned: abandonedMatches,
            });

            // Check abandonment pattern
            const hasExcessivePattern = await aiMatchManager.hasExcessiveAbandonmentPattern(playerId);

            // Calculate expected result
            const totalMatches = completedMatches + abandonedMatches;
            const abandonmentRate = abandonedMatches / totalMatches;
            const shouldBeRestricted = totalMatches >= 5 && abandonmentRate >= 0.5 && abandonedMatches >= 3;

            // Verify pattern detection matches expected logic
            expect(hasExcessivePattern).toBe(shouldBeRestricted);

            // For low abandonment cases, should not be restricted
            if (abandonedMatches <= 2) {
              expect(hasExcessivePattern).toBe(false);
            }
          },
        ),
        { numRuns: 25 },
      );
    });

    it("should restrict players with high abandonment rates and sufficient abandonment count", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            completedMatches: fc.integer({ min: 1, max: 10 }),
            abandonedMatches: fc.integer({ min: 3, max: 15 }), // High abandonment count
          }),
          async ({ playerId, completedMatches, abandonedMatches }) => {
            // Mock player stats with high abandonment rate
            const { getPlayerMatchStats } = await import("../lib/aiMatchStorage");
            vi.mocked(getPlayerMatchStats).mockResolvedValue({
              ai_matches_played: completedMatches,
              ai_matches_won: Math.floor(completedMatches * 0.4),
              ai_matches_lost: Math.floor(completedMatches * 0.4),
              ai_matches_tied: completedMatches - Math.floor(completedMatches * 0.8),
              ai_matches_abandoned: abandonedMatches,
            });

            // Check abandonment pattern
            const hasExcessivePattern = await aiMatchManager.hasExcessiveAbandonmentPattern(playerId);

            // Calculate expected result
            const totalMatches = completedMatches + abandonedMatches;
            const abandonmentRate = abandonedMatches / totalMatches;
            const shouldBeRestricted = totalMatches >= 5 && abandonmentRate >= 0.5 && abandonedMatches >= 3;

            // Verify pattern detection
            expect(hasExcessivePattern).toBe(shouldBeRestricted);

            // If conditions are met, should be restricted
            if (totalMatches >= 5 && abandonmentRate >= 0.5 && abandonedMatches >= 3) {
              expect(hasExcessivePattern).toBe(true);
            }
          },
        ),
        { numRuns: 25 },
      );
    });

    it("should not restrict new players with insufficient match history", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            totalMatches: fc.integer({ min: 1, max: 4 }), // Below 5-match threshold
            abandonmentRatio: fc.float({ min: 0, max: 1 }), // Any abandonment ratio
          }),
          async ({ playerId, totalMatches, abandonmentRatio }) => {
            const abandonedMatches = Math.floor(totalMatches * abandonmentRatio);
            const completedMatches = totalMatches - abandonedMatches;

            // Mock player stats with insufficient history
            const { getPlayerMatchStats } = await import("../lib/aiMatchStorage");
            vi.mocked(getPlayerMatchStats).mockResolvedValue({
              ai_matches_played: completedMatches,
              ai_matches_won: Math.floor(completedMatches * 0.5),
              ai_matches_lost: Math.floor(completedMatches * 0.4),
              ai_matches_tied: completedMatches - Math.floor(completedMatches * 0.9),
              ai_matches_abandoned: abandonedMatches,
            });

            // Check abandonment pattern
            const hasExcessivePattern = await aiMatchManager.hasExcessiveAbandonmentPattern(playerId);

            // New players should never be restricted regardless of abandonment rate
            expect(hasExcessivePattern).toBe(false);
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should handle edge cases in abandonment rate calculation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            scenario: fc.constantFrom(
              "exactly_50_percent", // Exactly 50% abandonment rate
              "just_under_threshold", // Just under 50%
              "just_over_threshold", // Just over 50%
              "all_abandoned", // 100% abandonment
              "no_abandoned", // 0% abandonment
            ),
          }),
          async ({ playerId, scenario }) => {
            let completedMatches: number;
            let abandonedMatches: number;

            switch (scenario) {
              case "exactly_50_percent":
                completedMatches = 5;
                abandonedMatches = 5; // 50% rate
                break;
              case "just_under_threshold":
                completedMatches = 6;
                abandonedMatches = 4; // 40% rate
                break;
              case "just_over_threshold":
                completedMatches = 4;
                abandonedMatches = 6; // 60% rate
                break;
              case "all_abandoned":
                completedMatches = 0;
                abandonedMatches = 8; // 100% rate
                break;
              case "no_abandoned":
                completedMatches = 10;
                abandonedMatches = 0; // 0% rate
                break;
            }

            // Mock player stats
            const { getPlayerMatchStats } = await import("../lib/aiMatchStorage");
            vi.mocked(getPlayerMatchStats).mockResolvedValue({
              ai_matches_played: completedMatches,
              ai_matches_won: Math.floor(completedMatches * 0.5),
              ai_matches_lost: Math.floor(completedMatches * 0.4),
              ai_matches_tied: completedMatches - Math.floor(completedMatches * 0.9),
              ai_matches_abandoned: abandonedMatches,
            });

            // Check abandonment pattern
            const hasExcessivePattern = await aiMatchManager.hasExcessiveAbandonmentPattern(playerId);

            // Calculate expected result
            const totalMatches = completedMatches + abandonedMatches;
            const abandonmentRate = abandonedMatches / totalMatches;
            const shouldBeRestricted = totalMatches >= 5 && abandonmentRate >= 0.5 && abandonedMatches >= 3;

            // Verify correct behavior for each scenario
            expect(hasExcessivePattern).toBe(shouldBeRestricted);

            // Specific scenario validations
            switch (scenario) {
              case "exactly_50_percent":
                expect(hasExcessivePattern).toBe(true); // 50% rate with 5 abandonments
                break;
              case "just_under_threshold":
                expect(hasExcessivePattern).toBe(false); // Under 50% rate
                break;
              case "just_over_threshold":
                expect(hasExcessivePattern).toBe(true); // Over 50% rate with 6 abandonments
                break;
              case "all_abandoned":
                expect(hasExcessivePattern).toBe(true); // 100% rate with 8 abandonments
                break;
              case "no_abandoned":
                expect(hasExcessivePattern).toBe(false); // 0% rate
                break;
            }
          },
        ),
        { numRuns: 15 },
      );
    });

    it("should prevent match creation for players with excessive abandonment patterns", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            hasExcessiveAbandonments: fc.boolean(),
          }),
          async ({ playerId, hasExcessiveAbandonments }) => {
            // Clear all mocks for this test run to ensure isolation
            vi.clearAllMocks();

            // Mock storage functions
            const { getActiveMatchForPlayer, getPlayerMatchStats, saveActiveMatchToRedis } = await import(
              "../lib/aiMatchStorage"
            );
            vi.mocked(getActiveMatchForPlayer).mockResolvedValue(null); // No existing match
            vi.mocked(saveActiveMatchToRedis).mockResolvedValue(undefined);

            if (hasExcessiveAbandonments) {
              // Mock high abandonment stats
              vi.mocked(getPlayerMatchStats).mockResolvedValue({
                ai_matches_played: 5,
                ai_matches_won: 2,
                ai_matches_lost: 2,
                ai_matches_tied: 1,
                ai_matches_abandoned: 5, // 50% abandonment rate with 5 abandonments
              });

              // Should throw error when trying to start match
              await expect(aiMatchManager.startMatch(playerId)).rejects.toThrow(/excessive abandonment patterns/);

              // Verify no match was saved
              expect(saveActiveMatchToRedis).not.toHaveBeenCalled();
            } else {
              // Mock low abandonment stats
              vi.mocked(getPlayerMatchStats).mockResolvedValue({
                ai_matches_played: 10,
                ai_matches_won: 6,
                ai_matches_lost: 3,
                ai_matches_tied: 1,
                ai_matches_abandoned: 1, // Low abandonment rate
              });

              // Should successfully create match
              const match = await aiMatchManager.startMatch(playerId);

              expect(match).toBeDefined();
              expect(match.playerId).toBe(playerId);
              expect(match.status).toBe(MatchStatus.ACTIVE);
              expect(saveActiveMatchToRedis).toHaveBeenCalledWith(match);
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should handle database errors gracefully during pattern checking", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            errorType: fc.constantFrom("network_error", "database_timeout", "permission_denied"),
          }),
          async ({ playerId, errorType }) => {
            // Mock storage functions
            const { getActiveMatchForPlayer, getPlayerMatchStats, saveActiveMatchToRedis } = await import(
              "../lib/aiMatchStorage"
            );
            vi.mocked(getActiveMatchForPlayer).mockResolvedValue(null);
            vi.mocked(saveActiveMatchToRedis).mockResolvedValue(undefined);

            // Mock database error
            const errorMessages = {
              network_error: "Network connection failed",
              database_timeout: "Database query timeout",
              permission_denied: "Access denied",
            };
            vi.mocked(getPlayerMatchStats).mockRejectedValue(new Error(errorMessages[errorType]));

            // Should gracefully handle error and allow match creation
            const match = await aiMatchManager.startMatch(playerId);

            expect(match).toBeDefined();
            expect(match.playerId).toBe(playerId);
            expect(match.status).toBe(MatchStatus.ACTIVE);

            // Verify match was saved despite stats error
            expect(saveActiveMatchToRedis).toHaveBeenCalledWith(match);
          },
        ),
        { numRuns: 15 },
      );
    });
  });
});
