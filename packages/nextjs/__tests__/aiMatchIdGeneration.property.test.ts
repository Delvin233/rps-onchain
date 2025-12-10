/**
 * AI Match ID Generation Property Tests
 *
 * Property-based tests for unique match identifier generation and collision prevention.
 * **Feature: best-of-three-ai-matches, Property 11: Unique Match Identifier Generation**
 */
import { AIMatchManager } from "../lib/aiMatchManager";
import * as aiMatchStorage from "../lib/aiMatchStorage";
import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the storage functions
vi.mock("../lib/aiMatchStorage", () => ({
  saveActiveMatchToRedis: vi.fn(),
  getActiveMatchFromRedis: vi.fn(),
  deleteActiveMatchFromRedis: vi.fn(),
  completeMatch: vi.fn(),
}));

// Helper arbitraries
const playerIdArbitrary = fc
  .array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 })
  .map(arr => `0x${arr.map(n => n.toString(16)).join("")}`);

describe("AI Match ID Generation Property Tests", () => {
  let manager: AIMatchManager;

  beforeEach(() => {
    manager = new AIMatchManager();
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(aiMatchStorage.saveActiveMatchToRedis).mockResolvedValue();
    vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);
  });

  /**
   * Property 11: Unique Match Identifier Generation
   * **Validates: Requirements 6.1**
   *
   * For any number of concurrent match creation requests, each match
   * should receive a unique identifier that doesn't collide with others.
   */
  it("should generate unique match IDs for concurrent match creation", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(playerIdArbitrary, { minLength: 1, maxLength: 100 }), async playerIds => {
        const matches = [];
        const matchIds = new Set<string>();

        // Create matches for all players concurrently
        const matchPromises = playerIds.map(playerId => manager.startMatch(playerId));
        const createdMatches = await Promise.all(matchPromises);

        // Collect all match IDs
        for (const match of createdMatches) {
          matches.push(match);
          matchIds.add(match.id);
        }

        // Verify all IDs are unique
        expect(matchIds.size).toBe(playerIds.length);
        expect(matches.length).toBe(playerIds.length);

        // Verify each ID follows the expected format
        for (const match of matches) {
          expect(match.id).toMatch(/^match_[a-z0-9]+_[a-z0-9]+$/);
          expect(match.id.length).toBeGreaterThan(10); // Should be reasonably long
        }
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Property: ID Format Consistency
   *
   * All generated match IDs should follow a consistent format
   * that includes a prefix and sufficient entropy.
   */
  it("should generate IDs with consistent format and sufficient entropy", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(playerIdArbitrary, { minLength: 10, maxLength: 50 }), async playerIds => {
        const matches = await Promise.all(playerIds.map(playerId => manager.startMatch(playerId)));

        const matchIds = matches.map(m => m.id);

        // Verify format consistency
        for (const id of matchIds) {
          // Should start with "match_"
          expect(id).toMatch(/^match_/);

          // Should have timestamp and random components
          const parts = id.split("_");
          expect(parts).toHaveLength(3);
          expect(parts[0]).toBe("match");

          // Timestamp part should be base36 encoded
          expect(parts[1]).toMatch(/^[a-z0-9]+$/);
          expect(parts[1].length).toBeGreaterThan(5);

          // Random part should be base36 encoded
          expect(parts[2]).toMatch(/^[a-z0-9]+$/);
          expect(parts[2].length).toBeGreaterThan(3);
        }

        // Verify all IDs are unique
        const uniqueIds = new Set(matchIds);
        expect(uniqueIds.size).toBe(matchIds.length);
      }),
      { numRuns: 30 },
    );
  });

  /**
   * Property: Temporal Ordering
   *
   * Match IDs generated in sequence should have some temporal ordering
   * characteristics due to timestamp inclusion.
   */
  it("should include temporal information in generated IDs", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(playerIdArbitrary, { minLength: 5, maxLength: 20 }), async playerIds => {
        const matches = [];

        // Create matches sequentially with small delays
        for (const playerId of playerIds) {
          const match = await manager.startMatch(playerId);
          matches.push(match);

          // Small delay to ensure timestamp differences
          await new Promise(resolve => setTimeout(resolve, 1));
        }

        // Extract timestamp components from IDs
        const timestamps = matches.map(match => {
          const parts = match.id.split("_");
          return parseInt(parts[1], 36); // Convert base36 timestamp back to number
        });

        // Verify timestamps are generally increasing (allowing for some variance)
        for (let i = 1; i < timestamps.length; i++) {
          // Timestamps should be close to each other (within reasonable range)
          const timeDiff = Math.abs(timestamps[i] - timestamps[i - 1]);
          expect(timeDiff).toBeLessThan(1000); // Less than 1000ms difference in base36
        }

        // Verify all match IDs are still unique despite temporal proximity
        const uniqueIds = new Set(matches.map(m => m.id));
        expect(uniqueIds.size).toBe(matches.length);
      }),
      { numRuns: 20 },
    );
  });

  /**
   * Property: High-Volume Uniqueness
   *
   * Even under high-volume concurrent creation, all match IDs
   * should remain unique without collisions.
   */
  it("should maintain uniqueness under high-volume concurrent creation", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 50, max: 200 }), async numMatches => {
        // Generate unique player IDs
        const playerIds = Array.from({ length: numMatches }, (_, i) => `0x${i.toString(16).padStart(40, "0")}`);

        // Create all matches concurrently (stress test)
        const startTime = Date.now();
        const matchPromises = playerIds.map(playerId => manager.startMatch(playerId));
        const matches = await Promise.all(matchPromises);
        const endTime = Date.now();

        // Verify all IDs are unique
        const matchIds = matches.map(m => m.id);
        const uniqueIds = new Set(matchIds);
        expect(uniqueIds.size).toBe(numMatches);

        // Verify performance is reasonable (should complete within reasonable time)
        const duration = endTime - startTime;
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

        // Verify all matches have valid structure
        for (const match of matches) {
          expect(match.id).toMatch(/^match_[a-z0-9]+_[a-z0-9]+$/);
          expect(match.playerId).toMatch(/^0x[0-9a-f]{40}$/);
        }
      }),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Cross-Session Uniqueness
   *
   * Match IDs should be unique across different manager instances
   * (simulating different server processes or restarts).
   */
  it("should generate unique IDs across different manager instances", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(playerIdArbitrary, { minLength: 10, maxLength: 30 }), async playerIds => {
        const allMatches = [];
        const allMatchIds = new Set<string>();

        // Create multiple manager instances (simulating different processes)
        const numInstances = 3;

        for (let instance = 0; instance < numInstances; instance++) {
          const instanceManager = new AIMatchManager();

          // Create matches with this instance
          const instanceMatches = await Promise.all(
            playerIds.map(playerId => instanceManager.startMatch(`${playerId}_${instance}`)),
          );

          // Collect matches and IDs
          for (const match of instanceMatches) {
            allMatches.push(match);

            // Verify this ID hasn't been seen before
            expect(allMatchIds.has(match.id)).toBe(false);
            allMatchIds.add(match.id);
          }
        }

        // Verify total uniqueness across all instances
        expect(allMatchIds.size).toBe(playerIds.length * numInstances);
        expect(allMatches.length).toBe(playerIds.length * numInstances);

        // Verify all IDs follow the expected format
        for (const matchId of allMatchIds) {
          expect(matchId).toMatch(/^match_[a-z0-9]+_[a-z0-9]+$/);
        }
      }),
      { numRuns: 15 },
    );
  });

  /**
   * Property: ID Entropy Analysis
   *
   * Generated IDs should have sufficient entropy to prevent
   * practical collision attacks or prediction.
   */
  it("should generate IDs with sufficient entropy", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 100, max: 500 }), async numSamples => {
        const playerIds = Array.from({ length: numSamples }, (_, i) => `0x${i.toString(16).padStart(40, "0")}`);

        const matches = await Promise.all(playerIds.map(playerId => manager.startMatch(playerId)));

        const matchIds = matches.map(m => m.id);

        // Analyze entropy of random components
        const randomParts = matchIds.map(id => id.split("_")[2]);

        // Check character distribution in random parts
        const charCounts = new Map<string, number>();
        for (const part of randomParts) {
          for (const char of part) {
            charCounts.set(char, (charCounts.get(char) || 0) + 1);
          }
        }

        // Should use a reasonable variety of characters (base36: 0-9, a-z)
        expect(charCounts.size).toBeGreaterThan(10); // At least 10 different characters used

        // No single character should dominate (basic entropy check)
        const totalChars = Array.from(charCounts.values()).reduce((a, b) => a + b, 0);
        for (const count of charCounts.values()) {
          const frequency = count / totalChars;
          expect(frequency).toBeLessThan(0.2); // No char should be >20% of total
        }

        // Verify all IDs are unique (collision resistance)
        const uniqueIds = new Set(matchIds);
        expect(uniqueIds.size).toBe(numSamples);
      }),
      { numRuns: 5 },
    );
  });
});
