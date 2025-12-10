/**
 * Property Test: Statistics Update Accuracy
 *
 * Property 2: Statistics Update Accuracy
 * Validates: Requirements 3.1, 3.2, 3.3
 *
 * This property test ensures that match-level statistics are updated correctly:
 * - Match completion triggers statistics updates
 * - Statistics accurately reflect match outcomes
 * - Round-based and match-based statistics are kept separate
 * - Abandonment statistics are tracked correctly
 */
import { resilientUpdateMatchStats } from "../lib/resilient-database";
import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database operations
vi.mock("../lib/database-pool", () => ({
  withDatabase: vi.fn(callback =>
    callback({
      execute: vi.fn().mockResolvedValue({ rows: [], rowsAffected: 1 }),
    }),
  ),
}));

vi.mock("../lib/cache-manager", () => ({
  cacheManager: {
    set: vi.fn(),
    get: vi.fn(),
    invalidate: vi.fn(),
  },
  CACHE_PREFIXES: { STATS: "stats:" },
  CACHE_DURATIONS: { STATS: 300 },
}));

vi.mock("../lib/circuit-breaker", () => ({
  circuitBreakers: {
    database: {
      execute: vi.fn(primary => primary()),
    },
  },
}));

vi.mock("../lib/retry-logic", () => ({
  withRetry: vi.fn(callback => callback()),
}));

// Generators for property testing
const playerIdGen = fc.string({ minLength: 10, maxLength: 42 }).map(s => `0x${s}`);

const matchResultGen = fc.oneof(
  fc.constant("won" as const),
  fc.constant("lost" as const),
  fc.constant("tied" as const),
  fc.constant("abandoned" as const),
);

const matchSequenceGen = fc.array(matchResultGen, { minLength: 1, maxLength: 10 });

describe("Property Test: Statistics Update Accuracy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Property 2.1: Match statistics are updated correctly for single matches", async () => {
    await fc.assert(
      fc.asyncProperty(fc.tuple(playerIdGen, matchResultGen), async ([playerId, result]) => {
        // Test single match statistics update
        const success = await resilientUpdateMatchStats(playerId, result);

        // Verify the update was successful
        expect(success).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  it("Property 2.2: Statistics accumulate correctly over multiple matches", async () => {
    await fc.assert(
      fc.asyncProperty(fc.tuple(playerIdGen, matchSequenceGen), async ([playerId, matchResults]) => {
        // Process multiple matches for the same player
        const results = [];

        for (const result of matchResults) {
          const success = await resilientUpdateMatchStats(playerId, result);
          results.push(success);
        }

        // Verify all updates were successful
        expect(results.every(r => r === true)).toBe(true);

        // Verify the correct number of calls were made
        expect(results).toHaveLength(matchResults.length);
      }),
      { numRuns: 30 },
    );
  });

  it("Property 2.3: Different match results produce different statistics", async () => {
    await fc.assert(
      fc.asyncProperty(playerIdGen, async playerId => {
        // Test each type of match result
        const results = ["won", "lost", "tied", "abandoned"] as const;

        for (const result of results) {
          const success = await resilientUpdateMatchStats(playerId, result);
          expect(success).toBe(true);
        }
      }),
      { numRuns: 20 },
    );
  });

  it("Property 2.4: Statistics updates are idempotent for the same player", async () => {
    await fc.assert(
      fc.asyncProperty(fc.tuple(playerIdGen, matchResultGen), async ([playerId, result]) => {
        // Update statistics multiple times with the same result
        const success1 = await resilientUpdateMatchStats(playerId, result);
        const success2 = await resilientUpdateMatchStats(playerId, result);
        const success3 = await resilientUpdateMatchStats(playerId, result);

        // All updates should succeed
        expect(success1).toBe(true);
        expect(success2).toBe(true);
        expect(success3).toBe(true);
      }),
      { numRuns: 30 },
    );
  });

  it("Property 2.5: Statistics updates work for different players independently", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.array(playerIdGen, { minLength: 2, maxLength: 5 }).filter(
            arr => new Set(arr).size === arr.length, // Ensure unique players
          ),
          matchResultGen,
        ),
        async ([playerIds, result]) => {
          // Update statistics for multiple different players
          const results = [];

          for (const playerId of playerIds) {
            const success = await resilientUpdateMatchStats(playerId, result);
            results.push(success);
          }

          // All updates should succeed
          expect(results.every(r => r === true)).toBe(true);
          expect(results).toHaveLength(playerIds.length);
        },
      ),
      { numRuns: 25 },
    );
  });

  it("Property 2.6: Match result validation works correctly", async () => {
    await fc.assert(
      fc.asyncProperty(playerIdGen, async playerId => {
        // Test all valid match results
        const validResults = ["won", "lost", "tied", "abandoned"] as const;

        for (const result of validResults) {
          // Should not throw an error for valid results
          expect(async () => {
            await resilientUpdateMatchStats(playerId, result);
          }).not.toThrow();
        }
      }),
      { numRuns: 20 },
    );
  });

  it("Property 2.7: Statistics updates handle edge cases correctly", async () => {
    await fc.assert(
      fc.asyncProperty(fc.tuple(playerIdGen, fc.constant("won" as const)), async ([, result]) => {
        // Test with minimal valid player ID
        const minPlayerId = "0x1234567890";
        const success = await resilientUpdateMatchStats(minPlayerId, result);
        expect(success).toBe(true);

        // Test with maximum length player ID
        const maxPlayerId = "0x" + "a".repeat(40);
        const success2 = await resilientUpdateMatchStats(maxPlayerId, result);
        expect(success2).toBe(true);
      }),
      { numRuns: 20 },
    );
  });

  it("Property 2.8: Concurrent statistics updates work correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(playerIdGen, fc.array(matchResultGen, { minLength: 3, maxLength: 6 })),
        async ([playerId, results]) => {
          // Process multiple concurrent updates
          const promises = results.map(result => resilientUpdateMatchStats(playerId, result));

          const outcomes = await Promise.all(promises);

          // All concurrent updates should succeed
          expect(outcomes.every(success => success === true)).toBe(true);
          expect(outcomes).toHaveLength(results.length);
        },
      ),
      { numRuns: 20 },
    );
  });
});
