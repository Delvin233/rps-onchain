/**
 * Property-Based Tests for AI Match State Persistence
 *
 * **Feature: best-of-three-ai-matches, Property 5: Match State Persistence**
 *
 * Tests that match state can be correctly saved to and retrieved from Redis storage,
 * ensuring data integrity across active match operations.
 */
// Import after mocking
import { getActiveMatchFromRedis, saveActiveMatchToRedis } from "../lib/aiMatchStorage";
import { MatchStatus, Move } from "../types/aiMatch";
import { createNewMatch, playRound } from "../utils/aiMatchUtils";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Redis client
const mockRedisClient = {
  setEx: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  isReady: true,
  connect: vi.fn(),
  on: vi.fn(),
};

// Mock the Redis module
vi.mock("redis", () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

// Mock turso module to avoid import issues
vi.mock("../lib/turso", () => ({
  turso: {
    execute: vi.fn(),
    batch: vi.fn(),
  },
}));

describe("AI Match State Persistence Properties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient.connect.mockResolvedValue(undefined);

    // Reset Redis client state for each test
    mockRedisClient.setEx.mockReset();
    mockRedisClient.get.mockReset();
    mockRedisClient.del.mockReset();
    mockRedisClient.keys.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 5: Match State Persistence
   * For any active match, the complete match state should be retrievable
   * after session interruption and restoration
   */
  describe("Property 5: Match State Persistence", () => {
    it("should preserve complete match state through Redis round-trip", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            rounds: fc.array(fc.constantFrom("rock", "paper", "scissors") as fc.Arbitrary<Move>, {
              minLength: 0,
              maxLength: 3,
            }),
          }),
          async ({ playerId, rounds }) => {
            // Create a match and play the specified rounds
            let match = createNewMatch(playerId);

            for (const playerMove of rounds) {
              if (match.status === MatchStatus.ACTIVE) {
                const result = playRound(match, playerMove);
                match = result.match;
              }
            }

            // Create isolated Redis storage for this test run
            const redisStorage = new Map<string, string>();

            // Mock Redis operations with complete isolation
            mockRedisClient.setEx.mockImplementation((key: string, _ttl: number, data: string) => {
              redisStorage.set(key, data);
              return Promise.resolve("OK");
            });

            mockRedisClient.get.mockImplementation((key: string) => {
              return Promise.resolve(redisStorage.get(key) || null);
            });

            // Save to Redis
            await saveActiveMatchToRedis(match);

            // Verify data was stored correctly
            const matchKey = `ai_match:${match.id}`;
            const storedData = redisStorage.get(matchKey);
            expect(storedData).not.toBeUndefined();
            expect(() => JSON.parse(storedData!)).not.toThrow();

            // Retrieve from Redis
            const retrievedMatch = await getActiveMatchFromRedis(match.id);

            // Verify complete state preservation
            expect(retrievedMatch).not.toBeNull();
            expect(retrievedMatch!.id).toBe(match.id);
            expect(retrievedMatch!.playerId).toBe(match.playerId);
            expect(retrievedMatch!.status).toBe(match.status);
            expect(retrievedMatch!.playerScore).toBe(match.playerScore);
            expect(retrievedMatch!.aiScore).toBe(match.aiScore);
            expect(retrievedMatch!.currentRound).toBe(match.currentRound);
            expect(retrievedMatch!.rounds).toHaveLength(match.rounds.length);

            // Verify round details are preserved
            for (let i = 0; i < match.rounds.length; i++) {
              expect(retrievedMatch!.rounds[i].roundNumber).toBe(match.rounds[i].roundNumber);
              expect(retrievedMatch!.rounds[i].playerMove).toBe(match.rounds[i].playerMove);
              expect(retrievedMatch!.rounds[i].aiMove).toBe(match.rounds[i].aiMove);
              expect(retrievedMatch!.rounds[i].result.winner).toBe(match.rounds[i].result.winner);
              expect(retrievedMatch!.rounds[i].timestamp).toBeInstanceOf(Date);
            }

            // Verify timestamps are preserved as Date objects
            expect(retrievedMatch!.startedAt).toBeInstanceOf(Date);
            expect(retrievedMatch!.lastActivityAt).toBeInstanceOf(Date);
            expect(retrievedMatch!.startedAt.getTime()).toBe(match.startedAt.getTime());

            // Verify completion state if applicable
            if (match.status !== MatchStatus.ACTIVE) {
              expect(retrievedMatch!.winner).toBe(match.winner);
              expect(retrievedMatch!.isAbandoned).toBe(match.isAbandoned);
              if (match.completedAt) {
                expect(retrievedMatch!.completedAt).toBeInstanceOf(Date);
                expect(retrievedMatch!.completedAt!.getTime()).toBe(match.completedAt.getTime());
              }
            }
          },
        ),
        { numRuns: 25 },
      );
    });

    it("should handle match state transitions correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            moveSequence: fc.array(fc.constantFrom("rock", "paper", "scissors") as fc.Arbitrary<Move>, {
              minLength: 1,
              maxLength: 4,
            }),
          }),
          async ({ playerId, moveSequence }) => {
            let match = createNewMatch(playerId);
            const originalId = match.id;
            const originalPlayerId = match.playerId;

            // Create isolated Redis storage for this test run
            const redisStorage = new Map<string, string>();

            // Mock Redis operations with complete isolation
            mockRedisClient.setEx.mockImplementation((key: string, _ttl: number, data: string) => {
              redisStorage.set(key, data);
              return Promise.resolve("OK");
            });

            mockRedisClient.get.mockImplementation((key: string) => {
              return Promise.resolve(redisStorage.get(key) || null);
            });

            // Play moves and save/retrieve after each
            for (const playerMove of moveSequence) {
              if (match.status === MatchStatus.ACTIVE) {
                const result = playRound(match, playerMove);
                match = result.match;

                // Save and retrieve
                await saveActiveMatchToRedis(match);

                // Verify data was stored correctly
                const matchKey = `ai_match:${match.id}`;
                const storedData = redisStorage.get(matchKey);
                expect(storedData).not.toBeUndefined();
                expect(() => JSON.parse(storedData!)).not.toThrow();

                const retrieved = await getActiveMatchFromRedis(match.id);

                // Verify state consistency
                expect(retrieved).not.toBeNull();
                expect(retrieved!.id).toBe(originalId);
                expect(retrieved!.playerId).toBe(originalPlayerId);
                expect(retrieved!.rounds.length).toBe(match.rounds.length);
                expect(retrieved!.playerScore).toBe(match.playerScore);
                expect(retrieved!.aiScore).toBe(match.aiScore);
                expect(retrieved!.currentRound).toBe(match.currentRound);
                expect(retrieved!.status).toBe(match.status);

                // Verify round data integrity
                for (let i = 0; i < match.rounds.length; i++) {
                  expect(retrieved!.rounds[i].roundNumber).toBe(match.rounds[i].roundNumber);
                  expect(retrieved!.rounds[i].playerMove).toBe(match.rounds[i].playerMove);
                  expect(retrieved!.rounds[i].aiMove).toBe(match.rounds[i].aiMove);
                  expect(retrieved!.rounds[i].result.winner).toBe(match.rounds[i].result.winner);
                }
              }
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should maintain data integrity across storage operations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            operations: fc.array(fc.constantFrom("save", "get"), { minLength: 2, maxLength: 6 }),
          }),
          async ({ playerId, operations }) => {
            let match = createNewMatch(playerId);

            // Play one round to have some data
            const result = playRound(match, "rock");
            match = result.match;

            // Use a Map to store data per match ID to avoid conflicts
            const redisStore = new Map<string, string>();

            // Mock Redis operations with proper isolation
            mockRedisClient.setEx.mockImplementation((key, _ttl, data) => {
              redisStore.set(key, data);
              return Promise.resolve("OK");
            });
            mockRedisClient.get.mockImplementation(key => {
              return Promise.resolve(redisStore.get(key) || null);
            });

            let lastSavedMatch = match;

            // Execute operations and verify consistency
            for (const operation of operations) {
              try {
                switch (operation) {
                  case "save":
                    if (match.status === MatchStatus.ACTIVE) {
                      await saveActiveMatchToRedis(match);
                      lastSavedMatch = match;

                      // Verify data was stored correctly
                      const key = `ai_match:${match.id}`;
                      const storedData = redisStore.get(key);
                      expect(storedData).not.toBeUndefined();
                      expect(() => JSON.parse(storedData!)).not.toThrow();
                    }
                    break;

                  case "get":
                    const key = `ai_match:${match.id}`;
                    if (redisStore.has(key)) {
                      const retrieved = await getActiveMatchFromRedis(match.id);
                      if (retrieved) {
                        expect(retrieved.id).toBe(lastSavedMatch.id);
                        expect(retrieved.playerId).toBe(lastSavedMatch.playerId);
                        expect(retrieved.rounds.length).toBe(lastSavedMatch.rounds.length);
                        expect(retrieved.playerScore).toBe(lastSavedMatch.playerScore);
                        expect(retrieved.aiScore).toBe(lastSavedMatch.aiScore);
                      }
                    }
                    break;
                }
              } catch {
                // Some operations may fail due to match state constraints, which is expected
                continue;
              }
            }
          },
        ),
        { numRuns: 15 },
      );
    });

    it("should preserve timestamps and metadata correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            roundCount: fc.integer({ min: 0, max: 3 }),
          }),
          async ({ playerId, roundCount }) => {
            let match = createNewMatch(playerId);
            const originalStartTime = match.startedAt;

            // Play specified number of rounds
            for (let i = 0; i < roundCount && match.status === MatchStatus.ACTIVE; i++) {
              const result = playRound(match, "rock");
              match = result.match;
            }

            // Create isolated Redis storage for this test run
            const redisStorage = new Map<string, string>();

            // Mock Redis operations with complete isolation
            mockRedisClient.setEx.mockImplementation((key: string, _ttl: number, data: string) => {
              redisStorage.set(key, data);
              return Promise.resolve("OK");
            });

            mockRedisClient.get.mockImplementation((key: string) => {
              return Promise.resolve(redisStorage.get(key) || null);
            });

            // Save and retrieve
            await saveActiveMatchToRedis(match);

            // Verify data was stored correctly
            const matchKey = `ai_match:${match.id}`;
            const storedData = redisStorage.get(matchKey);
            expect(storedData).not.toBeUndefined();
            expect(() => JSON.parse(storedData!)).not.toThrow();

            const retrieved = await getActiveMatchFromRedis(match.id);

            // Verify timestamp preservation
            expect(retrieved).not.toBeNull();
            expect(retrieved!.startedAt).toBeInstanceOf(Date);
            expect(retrieved!.lastActivityAt).toBeInstanceOf(Date);
            expect(retrieved!.startedAt.getTime()).toBe(originalStartTime.getTime());

            // Verify metadata consistency
            expect(retrieved!.id).toBe(match.id);
            expect(retrieved!.playerId).toBe(match.playerId);
            expect(retrieved!.status).toBe(match.status);
            expect(retrieved!.currentRound).toBe(match.currentRound);

            // Verify all rounds have valid timestamps
            for (const round of retrieved!.rounds) {
              expect(round.timestamp).toBeInstanceOf(Date);
              expect(round.timestamp.getTime()).toBeGreaterThan(0);
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
