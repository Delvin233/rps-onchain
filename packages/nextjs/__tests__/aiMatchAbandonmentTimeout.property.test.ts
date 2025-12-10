/**
 * Property-Based Tests for AI Match Abandonment Timeout
 *
 * **Feature: best-of-three-ai-matches, Property 7: Match Abandonment Timeout**
 *
 * Tests that matches inactive for more than 10 minutes are automatically
 * marked as abandoned and award victory to the AI.
 */
import { aiMatchManager } from "../lib/aiMatchManager";
import { MATCH_TIMEOUT_MINUTES, MatchStatus } from "../types/aiMatch";
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

// Mock storage functions
vi.mock("../lib/aiMatchStorage", () => ({
  saveActiveMatchToRedis: vi.fn(),
  getActiveMatchFromRedis: vi.fn(),
  getActiveMatchForPlayer: vi.fn(),
  completeMatch: vi.fn(),
  cleanupExpiredMatches: vi.fn(),
  deleteOldAbandonedMatches: vi.fn(),
  getAllActiveMatches: vi.fn(),
  getPlayerMatchStats: vi.fn(),
}));

describe("AI Match Abandonment Timeout Properties", () => {
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
   * Property 7: Match Abandonment Timeout
   * For any match inactive for more than 10 minutes, the system should automatically
   * mark it as abandoned and award victory to the AI
   */
  describe("Property 7: Match Abandonment Timeout", () => {
    it("should abandon matches that exceed timeout threshold", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            roundsPlayed: fc.integer({ min: 0, max: 2 }),
            minutesInactive: fc.integer({ min: MATCH_TIMEOUT_MINUTES + 1, max: MATCH_TIMEOUT_MINUTES + 60 }), // 11-70 minutes
          }),
          async ({ playerId, roundsPlayed, minutesInactive }) => {
            // Create a match and play some rounds
            let match = createNewMatch(playerId);

            for (let i = 0; i < roundsPlayed && match.status === MatchStatus.ACTIVE; i++) {
              const result = playRound(match, "rock");
              match = result.match;
            }

            // Simulate the match being inactive for the specified time
            const inactiveTime = new Date(Date.now() - minutesInactive * 60 * 1000);
            const timedOutMatch = {
              ...match,
              lastActivityAt: inactiveTime,
            };

            // Mock the storage to return the timed-out match
            const { getActiveMatchFromRedis, completeMatch } = await import("../lib/aiMatchStorage");
            vi.mocked(getActiveMatchFromRedis).mockResolvedValue(timedOutMatch);
            vi.mocked(completeMatch).mockResolvedValue(undefined);

            // Get match status - this should trigger timeout detection
            const result = await aiMatchManager.getMatchStatus(match.id);

            // Verify the match was abandoned
            expect(result).not.toBeNull();
            expect(result!.status).toBe(MatchStatus.ABANDONED);
            expect(result!.isAbandoned).toBe(true);
            expect(result!.winner).toBe("ai"); // AI wins by default on abandonment
            expect(result!.completedAt).toBeInstanceOf(Date);

            // Verify completeMatch was called to persist the abandonment
            expect(completeMatch).toHaveBeenCalledWith(
              expect.objectContaining({
                status: MatchStatus.ABANDONED,
                isAbandoned: true,
                winner: "ai",
              }),
            );
          },
        ),
        { numRuns: 25 },
      );
    });

    it("should not abandon matches within timeout threshold", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            roundsPlayed: fc.integer({ min: 0, max: 2 }),
            minutesInactive: fc.integer({ min: 0, max: MATCH_TIMEOUT_MINUTES - 1 }), // 0-9 minutes
          }),
          async ({ playerId, roundsPlayed, minutesInactive }) => {
            // Create a match and play some rounds
            let match = createNewMatch(playerId);

            for (let i = 0; i < roundsPlayed && match.status === MatchStatus.ACTIVE; i++) {
              const result = playRound(match, "rock");
              match = result.match;
            }

            // Simulate the match being inactive for less than timeout
            const recentTime = new Date(Date.now() - minutesInactive * 60 * 1000);
            const activeMatch = {
              ...match,
              lastActivityAt: recentTime,
            };

            // Mock the storage to return the active match
            const { getActiveMatchFromRedis, completeMatch } = await import("../lib/aiMatchStorage");
            vi.mocked(getActiveMatchFromRedis).mockResolvedValue(activeMatch);
            vi.mocked(completeMatch).mockResolvedValue(undefined);

            // Get match status - this should NOT trigger timeout
            const result = await aiMatchManager.getMatchStatus(match.id);

            // Verify the match was NOT abandoned
            expect(result).not.toBeNull();
            expect(result!.status).toBe(match.status); // Should remain in original status
            expect(result!.isAbandoned).toBe(false);
            expect(result!.winner).toBe(match.winner); // Should remain unchanged

            // Verify completeMatch was NOT called
            expect(completeMatch).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 25 },
      );
    });

    it("should preserve match state when abandoning due to timeout", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            playerMoves: fc.array(fc.constantFrom("rock", "paper", "scissors"), { minLength: 1, maxLength: 2 }),
            hoursInactive: fc.integer({ min: 1, max: 24 }), // 1-24 hours
          }),
          async ({ playerId, playerMoves, hoursInactive }) => {
            // Create a match and play the specified moves
            let match = createNewMatch(playerId);
            const originalId = match.id;
            const originalStartTime = match.startedAt;

            for (const playerMove of playerMoves) {
              if (match.status === MatchStatus.ACTIVE) {
                const result = playRound(match, playerMove);
                match = result.match;
              }
            }

            // Simulate long inactivity
            const inactiveTime = new Date(Date.now() - hoursInactive * 60 * 60 * 1000);
            const timedOutMatch = {
              ...match,
              lastActivityAt: inactiveTime,
            };

            // Mock the storage
            const { getActiveMatchFromRedis, completeMatch } = await import("../lib/aiMatchStorage");
            vi.mocked(getActiveMatchFromRedis).mockResolvedValue(timedOutMatch);
            vi.mocked(completeMatch).mockResolvedValue(undefined);

            // Get match status to trigger abandonment
            const result = await aiMatchManager.getMatchStatus(match.id);

            // Verify match state preservation
            expect(result).not.toBeNull();
            expect(result!.id).toBe(originalId);
            expect(result!.playerId).toBe(playerId);
            expect(result!.startedAt.getTime()).toBe(originalStartTime.getTime());
            expect(result!.rounds).toHaveLength(match.rounds.length);
            expect(result!.playerScore).toBe(match.playerScore);
            expect(result!.aiScore).toBe(match.aiScore);
            expect(result!.currentRound).toBe(match.currentRound);

            // Verify abandonment-specific changes
            expect(result!.status).toBe(MatchStatus.ABANDONED);
            expect(result!.isAbandoned).toBe(true);
            expect(result!.winner).toBe("ai");
            expect(result!.completedAt).toBeInstanceOf(Date);
            expect(result!.lastActivityAt).toBeInstanceOf(Date);

            // Verify all rounds are preserved
            for (let i = 0; i < match.rounds.length; i++) {
              expect(result!.rounds[i].roundNumber).toBe(match.rounds[i].roundNumber);
              expect(result!.rounds[i].playerMove).toBe(match.rounds[i].playerMove);
              expect(result!.rounds[i].aiMove).toBe(match.rounds[i].aiMove);
              expect(result!.rounds[i].result.winner).toBe(match.rounds[i].result.winner);
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should handle timeout detection consistently across different match states", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
            initialRounds: fc.integer({ min: 0, max: 3 }),
            timeoutMinutes: fc.constantFrom(
              MATCH_TIMEOUT_MINUTES + 1, // Just over threshold
              MATCH_TIMEOUT_MINUTES + 30, // Moderately over
              MATCH_TIMEOUT_MINUTES + 120, // Way over threshold
            ),
          }),
          async ({ playerId, initialRounds, timeoutMinutes }) => {
            // Create match with varying initial states
            let match = createNewMatch(playerId);

            // Play initial rounds
            for (let i = 0; i < initialRounds && match.status === MatchStatus.ACTIVE; i++) {
              const moves = ["rock", "paper", "scissors"];
              const playerMove = moves[i % 3] as any;
              const result = playRound(match, playerMove);
              match = result.match;
            }

            // Only test timeout on active matches
            if (match.status !== MatchStatus.ACTIVE) {
              return; // Skip completed matches
            }

            // Create timed-out version
            const timeoutTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
            const timedOutMatch = {
              ...match,
              lastActivityAt: timeoutTime,
            };

            // Mock storage
            const { getActiveMatchFromRedis, completeMatch } = await import("../lib/aiMatchStorage");
            vi.mocked(getActiveMatchFromRedis).mockResolvedValue(timedOutMatch);
            vi.mocked(completeMatch).mockResolvedValue(undefined);

            // Test timeout detection
            const result = await aiMatchManager.getMatchStatus(match.id);

            // Verify consistent abandonment behavior regardless of initial state
            expect(result).not.toBeNull();
            expect(result!.status).toBe(MatchStatus.ABANDONED);
            expect(result!.isAbandoned).toBe(true);
            expect(result!.winner).toBe("ai");
            expect(result!.completedAt).toBeInstanceOf(Date);

            // Verify the timeout calculation was correct
            const timeSinceLastActivity = Date.now() - timeoutTime.getTime();
            const minutesSinceActivity = timeSinceLastActivity / (60 * 1000);
            expect(minutesSinceActivity).toBeGreaterThan(MATCH_TIMEOUT_MINUTES);
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
