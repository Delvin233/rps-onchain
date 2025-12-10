/**
 * AI Match Lifecycle Property Tests
 *
 * Property-based tests for AI match lifecycle consistency and state transitions.
 * **Feature: best-of-three-ai-matches, Property 1: Match Lifecycle Consistency**
 */
import { AIMatchManager } from "../lib/aiMatchManager";
import * as aiMatchStorage from "../lib/aiMatchStorage";
import { MatchStatus } from "../types/aiMatch";
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
const moveArbitrary = fc.oneof(
  fc.constant("rock" as const),
  fc.constant("paper" as const),
  fc.constant("scissors" as const),
);

const playerIdArbitrary = fc
  .array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 })
  .map(arr => `0x${arr.map(n => n.toString(16)).join("")}`);

describe("AI Match Lifecycle Property Tests", () => {
  let manager: AIMatchManager;

  beforeEach(() => {
    manager = new AIMatchManager();
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(aiMatchStorage.saveActiveMatchToRedis).mockResolvedValue();
    vi.mocked(aiMatchStorage.completeMatch).mockResolvedValue();
  });

  /**
   * Property 1: Match Lifecycle Consistency
   * **Validates: Requirements 1.1, 1.2, 1.3**
   *
   * For any sequence of valid moves in a match, the match state should
   * remain consistent and follow the rules of best-of-three gameplay.
   */
  it("should maintain consistent match state throughout lifecycle", async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArbitrary,
        fc.array(moveArbitrary, { minLength: 1, maxLength: 10 }),
        async (playerId, moves) => {
          // Mock no existing active match for new game
          vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);

          // Start a new match
          const initialMatch = await manager.startMatch(playerId);

          // Verify initial state consistency
          expect(initialMatch.playerId).toBe(playerId);
          expect(initialMatch.status).toBe(MatchStatus.ACTIVE);
          expect(initialMatch.playerScore).toBe(0);
          expect(initialMatch.aiScore).toBe(0);
          expect(initialMatch.currentRound).toBe(1);
          expect(initialMatch.rounds).toHaveLength(0);
          expect(initialMatch.isAbandoned).toBe(false);
          expect(initialMatch.winner).toBeUndefined();
          expect(initialMatch.completedAt).toBeUndefined();

          let currentMatch = initialMatch;
          let roundsPlayed = 0;

          // Play rounds until match completes or we run out of moves
          for (const move of moves) {
            if (currentMatch.status !== MatchStatus.ACTIVE) {
              break; // Match already completed
            }

            // Mock the current match state for getMatchStatus
            vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(currentMatch);

            const result = await manager.playRound(currentMatch.id, move);
            currentMatch = result.match;
            roundsPlayed++;

            // Verify round consistency
            expect(currentMatch.rounds).toHaveLength(roundsPlayed);
            expect(currentMatch.currentRound).toBe(roundsPlayed + 1);

            // Verify round data integrity
            const lastRound = currentMatch.rounds[currentMatch.rounds.length - 1];
            expect(lastRound.roundNumber).toBe(roundsPlayed);
            expect(lastRound.playerMove).toBe(move);
            expect(["rock", "paper", "scissors"]).toContain(lastRound.aiMove);
            expect(["player", "ai", "tie"]).toContain(lastRound.result.winner);
            expect(lastRound.result.playerMove).toBe(move);
            expect(lastRound.result.aiMove).toBe(lastRound.aiMove);
            expect(lastRound.timestamp).toBeInstanceOf(Date);

            // Verify score consistency
            const playerWins = currentMatch.rounds.filter(r => r.result.winner === "player").length;
            const aiWins = currentMatch.rounds.filter(r => r.result.winner === "ai").length;
            expect(currentMatch.playerScore).toBe(playerWins);
            expect(currentMatch.aiScore).toBe(aiWins);

            // Verify match completion logic
            if (currentMatch.playerScore >= 2) {
              expect(currentMatch.status).toBe(MatchStatus.COMPLETED);
              expect(currentMatch.winner).toBe("player");
              expect(currentMatch.completedAt).toBeInstanceOf(Date);
            } else if (currentMatch.aiScore >= 2) {
              expect(currentMatch.status).toBe(MatchStatus.COMPLETED);
              expect(currentMatch.winner).toBe("ai");
              expect(currentMatch.completedAt).toBeInstanceOf(Date);
            } else if (roundsPlayed >= 3) {
              // All rounds played, match should be completed
              expect(currentMatch.status).toBe(MatchStatus.COMPLETED);
              expect(currentMatch.completedAt).toBeInstanceOf(Date);

              if (currentMatch.playerScore > currentMatch.aiScore) {
                expect(currentMatch.winner).toBe("player");
              } else if (currentMatch.aiScore > currentMatch.playerScore) {
                expect(currentMatch.winner).toBe("ai");
              } else {
                expect(currentMatch.winner).toBe("tie");
              }
            } else {
              // Match should still be active
              expect(currentMatch.status).toBe(MatchStatus.ACTIVE);
              expect(currentMatch.winner).toBeUndefined();
              expect(currentMatch.completedAt).toBeUndefined();
            }

            // Verify timestamps are consistent
            expect(currentMatch.lastActivityAt.getTime()).toBeGreaterThanOrEqual(currentMatch.startedAt.getTime());
            if (currentMatch.completedAt) {
              expect(currentMatch.completedAt.getTime()).toBeGreaterThanOrEqual(currentMatch.lastActivityAt.getTime());
            }

            // Verify abandonment flag consistency
            if (currentMatch.status === MatchStatus.ABANDONED) {
              expect(currentMatch.isAbandoned).toBe(true);
              expect(currentMatch.winner).toBe("ai"); // AI wins by default on abandonment
            } else {
              expect(currentMatch.isAbandoned).toBe(false);
            }
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property: Match ID Uniqueness
   *
   * Every match should have a unique identifier that doesn't collide
   * with other matches created in the same session.
   */
  it("should generate unique match IDs for concurrent matches", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(playerIdArbitrary, { minLength: 2, maxLength: 10 }), async playerIds => {
        // Mock no existing matches
        vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);

        const matches = [];
        const matchIds = new Set<string>();

        // Create matches for all players
        for (const playerId of playerIds) {
          const match = await manager.startMatch(playerId);
          matches.push(match);

          // Verify ID uniqueness
          expect(matchIds.has(match.id)).toBe(false);
          matchIds.add(match.id);

          // Verify ID format
          expect(match.id).toMatch(/^match_/);
        }

        // Verify all IDs are unique
        expect(matchIds.size).toBe(playerIds.length);
      }),
      { numRuns: 20 },
    );
  });

  /**
   * Property: Score Calculation Accuracy
   *
   * The match scores should always accurately reflect the number of
   * rounds won by each player.
   */
  it("should accurately calculate scores based on round outcomes", async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArbitrary,
        fc.array(moveArbitrary, { minLength: 1, maxLength: 5 }),
        async (playerId, moves) => {
          vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);

          const initialMatch = await manager.startMatch(playerId);
          let currentMatch = initialMatch;

          for (const move of moves) {
            if (currentMatch.status !== MatchStatus.ACTIVE) break;

            vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(currentMatch);

            const result = await manager.playRound(currentMatch.id, move);
            currentMatch = result.match;

            // Count actual wins from rounds
            const playerWins = currentMatch.rounds.filter(r => r.result.winner === "player").length;
            const aiWins = currentMatch.rounds.filter(r => r.result.winner === "ai").length;
            const ties = currentMatch.rounds.filter(r => r.result.winner === "tie").length;

            // Verify scores match round outcomes
            expect(currentMatch.playerScore).toBe(playerWins);
            expect(currentMatch.aiScore).toBe(aiWins);

            // Verify total rounds consistency
            expect(currentMatch.rounds.length).toBe(playerWins + aiWins + ties);
            expect(currentMatch.currentRound).toBe(currentMatch.rounds.length + 1);
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  /**
   * Property: Match Completion Conditions
   *
   * A match should complete exactly when one player reaches 2 wins
   * or when all 3 rounds have been played.
   */
  it("should complete matches under correct conditions", async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArbitrary,
        fc.array(moveArbitrary, { minLength: 2, maxLength: 6 }),
        async (playerId, moves) => {
          vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);

          const initialMatch = await manager.startMatch(playerId);
          let currentMatch = initialMatch;

          for (const move of moves) {
            if (currentMatch.status !== MatchStatus.ACTIVE) break;

            vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(currentMatch);

            const result = await manager.playRound(currentMatch.id, move);
            currentMatch = result.match;

            // Check completion conditions
            const hasWinner = currentMatch.playerScore >= 2 || currentMatch.aiScore >= 2;
            const allRoundsPlayed = currentMatch.rounds.length >= 3;

            if (hasWinner || allRoundsPlayed) {
              expect(currentMatch.status).toBe(MatchStatus.COMPLETED);
              expect(currentMatch.completedAt).toBeInstanceOf(Date);
              expect(currentMatch.winner).toBeDefined();
            } else {
              expect(currentMatch.status).toBe(MatchStatus.ACTIVE);
              expect(currentMatch.completedAt).toBeUndefined();
              expect(currentMatch.winner).toBeUndefined();
            }
          }
        },
      ),
      { numRuns: 40 },
    );
  });

  /**
   * Property: Round Number Sequence
   *
   * Round numbers should always be sequential starting from 1,
   * and the current round should always be one more than the
   * number of completed rounds.
   */
  it("should maintain sequential round numbering", async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArbitrary,
        fc.array(moveArbitrary, { minLength: 1, maxLength: 4 }),
        async (playerId, moves) => {
          vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);

          const initialMatch = await manager.startMatch(playerId);
          let currentMatch = initialMatch;

          expect(currentMatch.currentRound).toBe(1);
          expect(currentMatch.rounds).toHaveLength(0);

          for (let i = 0; i < moves.length; i++) {
            if (currentMatch.status !== MatchStatus.ACTIVE) break;

            vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(currentMatch);

            const result = await manager.playRound(currentMatch.id, moves[i]);
            currentMatch = result.match;

            // Verify round numbering
            expect(currentMatch.rounds).toHaveLength(i + 1);
            expect(currentMatch.currentRound).toBe(i + 2);

            // Verify each round has correct number
            for (let j = 0; j < currentMatch.rounds.length; j++) {
              expect(currentMatch.rounds[j].roundNumber).toBe(j + 1);
            }
          }
        },
      ),
      { numRuns: 25 },
    );
  });
});
