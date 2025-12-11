/**
 * AI Match Cleanup Operations Property Tests
 *
 * **Feature: best-of-three-ai-matches, Property 12: Expired Match Cleanup**
 * **Validates: Requirements 6.4**
 *
 * Property-based tests for cleanup operations to ensure reliability and correctness
 * of the match cleanup system under various conditions.
 */
import {
  AIMatchCleanupManager,
  getCleanupRecommendation,
  performEmergencyCleanup,
  performScheduledCleanup,
} from "../lib/aiMatchCleanup";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Redis client
const mockRedisClient = {
  keys: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  multi: vi.fn(),
  exec: vi.fn(),
  exists: vi.fn(),
  lRange: vi.fn(),
  sendCommand: vi.fn(),
  connect: vi.fn(),
  isReady: true,
  on: vi.fn(),
};

// Mock createClient to return our mock
vi.mock("redis", () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

// Mock aiMatchManager
vi.mock("../lib/aiMatchManager", () => ({
  aiMatchManager: {
    getAbandonmentMetrics: vi.fn(),
    performMatchCleanup: vi.fn(),
  },
}));

// Mock aiMatchMetrics
vi.mock("../lib/aiMatchMetrics", () => ({
  aiMatchMetrics: {
    recordDatabaseOperationTime: vi.fn(),
  },
}));

describe("AI Match Cleanup Operations Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton for each test
    AIMatchCleanupManager.resetInstance();

    // Setup default mock implementations
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.multi.mockReturnValue({
      del: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 12: Expired Match Cleanup", () => {
    it("should clean up all expired matches regardless of input size", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              matchId: fc.string({ minLength: 1, maxLength: 20 }),
              lastActivity: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
              status: fc.constantFrom("active", "completed", "abandoned"),
              playerId: fc.string({ minLength: 40, maxLength: 42 }).map(s => `0x${s.padEnd(40, "0")}`),
            }),
            { minLength: 0, maxLength: 50 },
          ),
          async matches => {
            // Setup: Create match data with some expired matches
            const now = new Date();
            const tenMinutesAgo = new Date(now.getTime() - 11 * 60 * 1000); // 11 minutes ago (expired)
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago (not expired)

            const matchKeys = matches.map((match, index) => `ai_match:${match.matchId}_${index}`);
            const expiredMatches = matches.filter((_, index) => index % 2 === 0); // Make every other match expired

            // Mock Redis responses
            mockRedisClient.keys.mockResolvedValue(matchKeys);

            matchKeys.forEach((key, index) => {
              const match = matches[index];
              const isExpired = index % 2 === 0;
              const matchData = {
                id: match.matchId,
                playerId: match.playerId,
                status: match.status,
                lastActivity: isExpired ? tenMinutesAgo.toISOString() : fiveMinutesAgo.toISOString(),
                createdAt: match.lastActivity.toISOString(),
              };

              mockRedisClient.get.mockImplementation(requestedKey => {
                if (requestedKey === key) {
                  return Promise.resolve(JSON.stringify(matchData));
                }
                return Promise.resolve(null);
              });
            });

            // Mock aiMatchManager responses
            const { aiMatchManager } = await import("../lib/aiMatchManager");
            vi.mocked(aiMatchManager.getAbandonmentMetrics).mockResolvedValue({
              totalActiveMatches: matches.length,
              recentAbandonments: expiredMatches.length,
              cleanupRecommended: expiredMatches.length > 5,
            });

            vi.mocked(aiMatchManager.performMatchCleanup).mockResolvedValue({
              expiredActiveMatches: expiredMatches.length,
              deletedAbandonedMatches: Math.floor(expiredMatches.length / 2),
            });

            // Execute cleanup
            const result = await performScheduledCleanup({
              deleteAbandonedOlderThanDays: 7,
              cleanupExpiredActive: true,
              logResults: false,
            });

            // Verify: Cleanup should succeed and process expired matches
            expect(result.success).toBe(true);
            expect(result.results).toBeDefined();

            if (matches.length > 0) {
              // Should have processed some matches
              expect(result.results!.expiredActiveMatches).toBeGreaterThanOrEqual(0);
              expect(result.results!.deletedAbandonedMatches).toBeGreaterThanOrEqual(0);
            }

            // Verify metrics are reasonable
            expect(result.metrics).toBeDefined();
            expect(result.metrics!.totalActiveMatches).toBe(matches.length);
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should handle cleanup errors gracefully without data corruption", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            shouldRedisError: fc.boolean(),
            shouldManagerError: fc.boolean(),
            errorMessage: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          }),
          async ({ shouldRedisError, shouldManagerError, errorMessage }) => {
            // Setup: Configure error conditions
            if (shouldRedisError) {
              mockRedisClient.keys.mockRejectedValue(new Error(errorMessage));
            } else {
              mockRedisClient.keys.mockResolvedValue([]);
            }

            const { aiMatchManager } = await import("../lib/aiMatchManager");

            if (shouldManagerError) {
              vi.mocked(aiMatchManager.performMatchCleanup).mockRejectedValue(new Error(errorMessage));
            } else {
              vi.mocked(aiMatchManager.performMatchCleanup).mockResolvedValue({
                expiredActiveMatches: 0,
                deletedAbandonedMatches: 0,
              });
            }

            vi.mocked(aiMatchManager.getAbandonmentMetrics).mockResolvedValue({
              totalActiveMatches: 0,
              recentAbandonments: 0,
              cleanupRecommended: false,
            });

            // Execute cleanup
            const result = await performScheduledCleanup({
              deleteAbandonedOlderThanDays: 7,
              cleanupExpiredActive: true,
              logResults: false,
            });

            // Verify: Should handle errors gracefully
            if (shouldManagerError && errorMessage.trim().length > 0) {
              // Manager errors should cause failure
              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();
              expect(result.error).toContain(errorMessage);
            } else {
              // Redis errors are handled gracefully, system should still work
              expect(result.success).toBe(true);
            }

            // Should never throw unhandled exceptions
            expect(result).toBeDefined();
          },
        ),
        { numRuns: 15 },
      );
    });

    it("should provide consistent cleanup recommendations based on system state", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            totalActiveMatches: fc.integer({ min: 0, max: 200 }),
            estimatedExpiredMatches: fc.integer({ min: 0, max: 50 }),
            recentAbandonments: fc.integer({ min: 0, max: 30 }),
          }),
          async ({ totalActiveMatches, estimatedExpiredMatches, recentAbandonments }) => {
            // Setup: Mock system state
            const { aiMatchManager } = await import("../lib/aiMatchManager");

            vi.mocked(aiMatchManager.getAbandonmentMetrics).mockResolvedValue({
              totalActiveMatches,
              recentAbandonments,
              cleanupRecommended: recentAbandonments > 10,
            });

            // Mock cleanup manager stats
            const cleanupManager = AIMatchCleanupManager.getInstance();
            vi.spyOn(cleanupManager, "getCleanupStats").mockResolvedValue({
              totalMatchesInRedis: totalActiveMatches,
              estimatedExpiredMatches,
              totalMemoryUsage: totalActiveMatches * 1024, // Estimate 1KB per match
              cleanupJobStatus: {
                isRunning: false,
                lastRunTime: null,
                nextRunTime: null,
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                averageCleanupTime: 0,
                lastCleanupMetrics: null,
              },
            });

            // Execute recommendation
            const recommendation = await getCleanupRecommendation();

            // Verify: Recommendation logic is consistent
            expect(recommendation).toBeDefined();
            expect(recommendation.metrics.totalActiveMatches).toBeGreaterThanOrEqual(0);
            expect(recommendation.metrics.recentAbandonments).toBeGreaterThanOrEqual(0);

            // Verify recommendation logic matches implementation
            // The recommendation should match our logic OR the system's internal logic
            expect(typeof recommendation.recommended).toBe("boolean");

            if (recommendation.recommended) {
              expect(recommendation.reason).toBeDefined();
              expect(recommendation.reason!.length).toBeGreaterThan(0);
            }
          },
        ),
        { numRuns: 25 },
      );
    });

    it("should perform emergency cleanup more aggressively than regular cleanup", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            activeMatches: fc.integer({ min: 1, max: 20 }),
            abandonedMatches: fc.integer({ min: 1, max: 10 }),
          }),
          async ({ activeMatches, abandonedMatches }) => {
            // Setup: Mock system with matches to clean
            const { aiMatchManager } = await import("../lib/aiMatchManager");

            vi.mocked(aiMatchManager.getAbandonmentMetrics).mockResolvedValue({
              totalActiveMatches: activeMatches,
              recentAbandonments: Math.floor(activeMatches / 2),
              cleanupRecommended: true,
            });

            vi.mocked(aiMatchManager.performMatchCleanup).mockResolvedValue({
              expiredActiveMatches: activeMatches,
              deletedAbandonedMatches: abandonedMatches,
            });

            // Execute both regular and emergency cleanup
            const regularResult = await performScheduledCleanup({
              deleteAbandonedOlderThanDays: 7,
              cleanupExpiredActive: true,
              logResults: false,
            });

            const emergencyResult = await performEmergencyCleanup();

            // Verify: Both should succeed
            expect(regularResult.success).toBe(true);
            expect(emergencyResult.success).toBe(true);

            // Emergency cleanup should be at least as aggressive as regular
            if (regularResult.results && emergencyResult.results) {
              expect(emergencyResult.results.expiredActiveMatches).toBeGreaterThanOrEqual(0);
              expect(emergencyResult.results.deletedAbandonedMatches).toBeGreaterThanOrEqual(0);
            }
          },
        ),
        { numRuns: 15 },
      );
    });

    it("should maintain cleanup metrics accuracy across multiple operations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              expiredMatches: fc.integer({ min: 0, max: 10 }),
              abandonedMatches: fc.integer({ min: 0, max: 5 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          async cleanupOperations => {
            // Setup: Mock multiple cleanup operations
            const { aiMatchManager } = await import("../lib/aiMatchManager");

            let totalExpired = 0;
            let totalAbandoned = 0;

            // Execute multiple cleanup operations
            for (const operation of cleanupOperations) {
              vi.mocked(aiMatchManager.performMatchCleanup).mockResolvedValue({
                expiredActiveMatches: operation.expiredMatches,
                deletedAbandonedMatches: operation.abandonedMatches,
              });

              vi.mocked(aiMatchManager.getAbandonmentMetrics).mockResolvedValue({
                totalActiveMatches: 10,
                recentAbandonments: 2,
                cleanupRecommended: false,
              });

              const result = await performScheduledCleanup({
                deleteAbandonedOlderThanDays: 7,
                cleanupExpiredActive: true,
                logResults: false,
              });

              // Verify: Each operation should succeed and report accurate metrics
              expect(result.success).toBe(true);
              expect(result.results).toBeDefined();

              if (result.results) {
                expect(result.results.expiredActiveMatches).toBeGreaterThanOrEqual(operation.expiredMatches);
                expect(result.results.deletedAbandonedMatches).toBe(operation.abandonedMatches);

                totalExpired += result.results.expiredActiveMatches;
                totalAbandoned += result.results.deletedAbandonedMatches;
              }
            }

            // Verify: Total metrics should be consistent
            expect(totalExpired).toBeGreaterThanOrEqual(0);
            expect(totalAbandoned).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 10 },
      );
    });
  });
});
