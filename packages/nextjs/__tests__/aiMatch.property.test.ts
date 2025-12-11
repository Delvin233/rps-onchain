/**
 * Property Tests for AI Match Data Model
 *
 * This file contains property-based tests that validate the correctness
 * of the AI match data model and business logic invariants.
 *
 * Property 1: Match Lifecycle Consistency
 * Validates: Requirements 1.1, 1.2, 1.3
 */
import { AIMatch, MAX_ROUNDS, MatchStatus, Move, ROUNDS_TO_WIN, Round } from "../types/aiMatch";
import {
  abandonMatch,
  calculateMatchDuration,
  checkMatchCompletion,
  createNewMatch,
  generateAIMove,
  generateMatchId,
  getMatchProgress,
  playRound,
  shouldAbandonMatch,
  validateMatchIntegrity,
} from "../utils/aiMatchUtils";
import { determineWinner } from "../utils/gameUtils";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

// Arbitraries for property testing
const moveArbitrary = fc.constantFrom("rock", "paper", "scissors") as fc.Arbitrary<Move>;

const ethereumAddressArbitrary = fc.constant("0x1234567890123456789012345678901234567890") as fc.Arbitrary<string>;

// Create a consistent round arbitrary that generates valid round data
const createRoundArbitrary = (roundNumber: number) =>
  fc
    .record({
      playerMove: moveArbitrary,
      aiMove: moveArbitrary,
      timestamp: fc.date({ min: new Date("2024-01-01"), max: new Date("2024-12-31") }),
    })
    .map(({ playerMove, aiMove, timestamp }) => {
      // Calculate the actual winner based on the moves
      const gameResult = determineWinner(playerMove, aiMove);
      const winner = gameResult === "win" ? "player" : gameResult === "lose" ? "ai" : "tie";

      return {
        roundNumber,
        playerMove,
        aiMove,
        result: {
          winner,
          playerMove,
          aiMove,
        },
        timestamp,
      };
    }) as fc.Arbitrary<Round>;

const activeMatchArbitrary = (playerId?: string) =>
  fc.integer({ min: 0, max: 2 }).chain(numRounds => {
    // Generate sequential rounds
    const rounds = Array.from({ length: numRounds }, (_, i) => createRoundArbitrary(i + 1));

    return fc
      .record({
        id: fc.uuid(),
        playerId: playerId ? fc.constant(playerId) : ethereumAddressArbitrary,
        status: fc.constant(MatchStatus.ACTIVE),
        rounds: numRounds === 0 ? fc.constant([]) : fc.tuple(...rounds),
        startedAt: fc.date({ min: new Date("2024-01-01"), max: new Date("2024-12-31") }),
        lastActivityAt: fc.date({ min: new Date("2024-01-01"), max: new Date("2024-12-31") }),
        completedAt: fc.constant(undefined),
        winner: fc.constant(undefined),
        isAbandoned: fc.constant(false),
      })
      .map(match => {
        // Calculate scores based on actual round results
        const rounds = Array.isArray(match.rounds) ? match.rounds : [];
        const playerScore = rounds.filter((r: Round) => r.result.winner === "player").length;
        const aiScore = rounds.filter((r: Round) => r.result.winner === "ai").length;

        return {
          ...match,
          rounds,
          playerScore,
          aiScore,
          currentRound: rounds.length + 1,
        };
      })
      .filter(
        match =>
          // Ensure active matches don't have winning conditions
          match.playerScore < ROUNDS_TO_WIN && match.aiScore < ROUNDS_TO_WIN && match.rounds.length <= MAX_ROUNDS - 1,
      );
  }) as fc.Arbitrary<AIMatch>;

describe("AI Match Data Model Property Tests", () => {
  describe("Property 1: Match Lifecycle Consistency", () => {
    it("should maintain valid state transitions throughout match lifecycle", () => {
      fc.assert(
        fc.property(
          ethereumAddressArbitrary,
          fc.array(moveArbitrary, { minLength: 1, maxLength: 5 }),
          (playerId, playerMoves) => {
            // Create new match
            const initialMatch = createNewMatch(playerId);

            // Verify initial state
            expect(initialMatch.status).toBe(MatchStatus.ACTIVE);
            expect(initialMatch.playerId).toBe(playerId);
            expect(initialMatch.rounds).toHaveLength(0);
            expect(initialMatch.playerScore).toBe(0);
            expect(initialMatch.aiScore).toBe(0);
            expect(initialMatch.currentRound).toBe(1);
            expect(initialMatch.isAbandoned).toBe(false);
            expect(initialMatch.winner).toBeUndefined();
            expect(initialMatch.completedAt).toBeUndefined();

            // Play rounds and verify state consistency
            let currentMatch = initialMatch;
            let roundsPlayed = 0;

            for (const playerMove of playerMoves) {
              // Stop if match is completed
              if (currentMatch.status !== MatchStatus.ACTIVE) {
                break;
              }

              // Stop if we've reached maximum rounds
              if (roundsPlayed >= MAX_ROUNDS) {
                break;
              }

              const beforeRounds = currentMatch.rounds.length;
              const beforePlayerScore = currentMatch.playerScore;
              const beforeAiScore = currentMatch.aiScore;

              // Play round
              const { match: updatedMatch, roundResult } = playRound(currentMatch, playerMove);

              // Verify round was added
              expect(updatedMatch.rounds).toHaveLength(beforeRounds + 1);

              // Verify round data consistency
              const newRound = updatedMatch.rounds[updatedMatch.rounds.length - 1];
              expect(newRound.roundNumber).toBe(beforeRounds + 1);
              expect(newRound.playerMove).toBe(playerMove);
              expect(newRound.result).toEqual(roundResult);

              // Verify score updates
              const expectedPlayerScore = beforePlayerScore + (roundResult.winner === "player" ? 1 : 0);
              const expectedAiScore = beforeAiScore + (roundResult.winner === "ai" ? 1 : 0);
              expect(updatedMatch.playerScore).toBe(expectedPlayerScore);
              expect(updatedMatch.aiScore).toBe(expectedAiScore);

              // Verify match completion logic
              const completion = checkMatchCompletion(updatedMatch);
              if (expectedPlayerScore >= ROUNDS_TO_WIN) {
                expect(completion.isCompleted).toBe(true);
                expect(completion.winner).toBe("player");
                expect(updatedMatch.status).toBe(MatchStatus.COMPLETED);
                expect(updatedMatch.winner).toBe("player");
                expect(updatedMatch.completedAt).toBeDefined();
              } else if (expectedAiScore >= ROUNDS_TO_WIN) {
                expect(completion.isCompleted).toBe(true);
                expect(completion.winner).toBe("ai");
                expect(updatedMatch.status).toBe(MatchStatus.COMPLETED);
                expect(updatedMatch.winner).toBe("ai");
                expect(updatedMatch.completedAt).toBeDefined();
              } else if (updatedMatch.rounds.length >= MAX_ROUNDS) {
                expect(completion.isCompleted).toBe(true);
                // When 3 rounds are completed, winner is determined by who has more wins
                const expectedWinner =
                  expectedPlayerScore > expectedAiScore
                    ? "player"
                    : expectedAiScore > expectedPlayerScore
                      ? "ai"
                      : "tie";
                expect(completion.winner).toBe(expectedWinner);
                expect(updatedMatch.status).toBe(MatchStatus.COMPLETED);
                expect(updatedMatch.winner).toBe(expectedWinner);
                expect(updatedMatch.completedAt).toBeDefined();
              } else {
                expect(completion.isCompleted).toBe(false);
                expect(updatedMatch.status).toBe(MatchStatus.ACTIVE);
                expect(updatedMatch.winner).toBeUndefined();
                expect(updatedMatch.completedAt).toBeUndefined();
              }

              // Verify data integrity
              const integrity = validateMatchIntegrity(updatedMatch);
              if (!integrity.isValid) {
                console.error("Integrity errors:", integrity.errors);
                console.error("Match data:", JSON.stringify(updatedMatch, null, 2));
              }
              expect(integrity.isValid).toBe(true);

              currentMatch = updatedMatch;
              roundsPlayed++;
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should maintain score consistency with round results", () => {
      fc.assert(
        fc.property(
          activeMatchArbitrary(),
          fc.array(moveArbitrary, { minLength: 1, maxLength: 3 }),
          (initialMatch, playerMoves) => {
            let currentMatch = initialMatch;

            for (const playerMove of playerMoves) {
              if (currentMatch.status !== MatchStatus.ACTIVE) break;
              if (currentMatch.rounds.length >= MAX_ROUNDS) break;

              const { match: updatedMatch } = playRound(currentMatch, playerMove);

              // Calculate expected scores from round results
              const playerWins = updatedMatch.rounds.filter(r => r.result.winner === "player").length;
              const aiWins = updatedMatch.rounds.filter(r => r.result.winner === "ai").length;

              expect(updatedMatch.playerScore).toBe(playerWins);
              expect(updatedMatch.aiScore).toBe(aiWins);

              currentMatch = updatedMatch;
            }
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should handle match abandonment correctly", () => {
      fc.assert(
        fc.property(activeMatchArbitrary(), match => {
          const abandonedMatch = abandonMatch(match);

          expect(abandonedMatch.status).toBe(MatchStatus.ABANDONED);
          expect(abandonedMatch.isAbandoned).toBe(true);
          expect(abandonedMatch.winner).toBe("ai"); // AI wins by default
          expect(abandonedMatch.completedAt).toBeDefined();

          // Verify integrity of abandoned match
          const integrity = validateMatchIntegrity(abandonedMatch);
          expect(integrity.isValid).toBe(true);
        }),
        { numRuns: 10 },
      );
    });

    it("should correctly detect timeout conditions", () => {
      fc.assert(
        fc.property(
          activeMatchArbitrary(),
          fc.integer({ min: 0, max: 20 }), // minutes ago
          (match, minutesAgo) => {
            // Set last activity time
            const lastActivity = new Date(Date.now() - minutesAgo * 60 * 1000);
            const testMatch = { ...match, lastActivityAt: lastActivity };

            const shouldAbandon = shouldAbandonMatch(testMatch);

            if (minutesAgo > 10) {
              // MATCH_TIMEOUT_MINUTES = 10
              expect(shouldAbandon).toBe(true);
            } else {
              expect(shouldAbandon).toBe(false);
            }
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should generate valid unique match IDs", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), count => {
          const ids = new Set<string>();

          for (let i = 0; i < count; i++) {
            const id = generateMatchId();

            // Verify UUID format
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

            // Verify uniqueness
            expect(ids.has(id)).toBe(false);
            ids.add(id);
          }
        }),
        { numRuns: 5 },
      );
    });

    it("should generate valid AI moves", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), count => {
          const validMoves: Move[] = ["rock", "paper", "scissors"];

          for (let i = 0; i < count; i++) {
            const aiMove = generateAIMove();
            expect(validMoves).toContain(aiMove);
          }
        }),
        { numRuns: 5 },
      );
    });

    it("should calculate match progress correctly", () => {
      fc.assert(
        fc.property(activeMatchArbitrary(), match => {
          const progress = getMatchProgress(match);

          expect(progress.roundsCompleted).toBe(match.rounds.length);
          expect(progress.roundsRemaining).toBe(MAX_ROUNDS - match.rounds.length);
          expect(progress.playerScore).toBe(match.playerScore);
          expect(progress.aiScore).toBe(match.aiScore);

          // Verify completion detection consistency
          const completion = checkMatchCompletion(match);
          expect(progress.isCompleted).toBe(completion.isCompleted);
          expect(progress.winner).toBe(completion.winner);
        }),
        { numRuns: 10 },
      );
    });

    it("should calculate match duration correctly", () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date("2024-01-01"), max: new Date("2024-12-31") }),
          fc.integer({ min: 1, max: 60 }), // duration in minutes
          (startDate, durationMinutes) => {
            const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

            const match: AIMatch = {
              id: generateMatchId(),
              playerId: "0x1234567890123456789012345678901234567890",
              status: MatchStatus.COMPLETED,
              rounds: [],
              playerScore: 0,
              aiScore: 0,
              currentRound: 1,
              startedAt: startDate,
              lastActivityAt: endDate,
              completedAt: endDate,
              winner: "tie",
              isAbandoned: false,
            };

            const calculatedDuration = calculateMatchDuration(match);
            expect(calculatedDuration).toBe(durationMinutes);
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should reject invalid moves in active matches", () => {
      fc.assert(
        fc.property(
          activeMatchArbitrary(),
          fc.string().filter(s => !["rock", "paper", "scissors"].includes(s)),
          (match, invalidMove) => {
            expect(() => {
              playRound(match, invalidMove as Move);
            }).toThrow("Invalid player move");
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should reject playing rounds in completed matches", () => {
      fc.assert(
        fc.property(activeMatchArbitrary(), moveArbitrary, (match, playerMove) => {
          // Complete the match first
          const completedMatch: AIMatch = {
            ...match,
            status: MatchStatus.COMPLETED,
            playerScore: ROUNDS_TO_WIN,
            winner: "player",
            completedAt: new Date(),
          };

          expect(() => {
            playRound(completedMatch, playerMove);
          }).toThrow("Match is not active");
        }),
        { numRuns: 10 },
      );
    });

    it("should maintain round number sequence integrity", () => {
      fc.assert(
        fc.property(
          ethereumAddressArbitrary,
          fc.array(moveArbitrary, { minLength: 1, maxLength: 3 }),
          (playerId, playerMoves) => {
            let currentMatch = createNewMatch(playerId);

            for (let i = 0; i < playerMoves.length; i++) {
              if (currentMatch.status !== MatchStatus.ACTIVE) break;

              const { match: updatedMatch } = playRound(currentMatch, playerMoves[i]);

              // Verify round numbers are sequential
              for (let j = 0; j < updatedMatch.rounds.length; j++) {
                expect(updatedMatch.rounds[j].roundNumber).toBe(j + 1);
              }

              currentMatch = updatedMatch;
            }
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should enforce maximum rounds limit", () => {
      fc.assert(
        fc.property(ethereumAddressArbitrary, playerId => {
          let currentMatch = createNewMatch(playerId);
          const moves: Move[] = ["rock", "paper", "scissors"];

          // Play exactly MAX_ROUNDS
          for (let i = 0; i < MAX_ROUNDS; i++) {
            if (currentMatch.status !== MatchStatus.ACTIVE) break;

            const { match: updatedMatch } = playRound(currentMatch, moves[i % 3]);
            currentMatch = updatedMatch;
          }

          // Verify we can't play more rounds
          if (currentMatch.status === MatchStatus.ACTIVE) {
            expect(() => {
              playRound(currentMatch, "rock");
            }).toThrow();
          }

          // Verify match has at most MAX_ROUNDS
          expect(currentMatch.rounds.length).toBeLessThanOrEqual(MAX_ROUNDS);
        }),
        { numRuns: 10 },
      );
    });

    it("should maintain timestamp ordering within matches", () => {
      fc.assert(
        fc.property(
          ethereumAddressArbitrary,
          fc.array(moveArbitrary, { minLength: 2, maxLength: 3 }),
          (playerId, playerMoves) => {
            let currentMatch = createNewMatch(playerId);

            for (const playerMove of playerMoves) {
              if (currentMatch.status !== MatchStatus.ACTIVE) break;

              const beforeTimestamp = currentMatch.lastActivityAt;

              const { match: updatedMatch } = playRound(currentMatch, playerMove);

              // Verify timestamps are ordered (should be greater than or equal since they might be the same millisecond)
              expect(updatedMatch.lastActivityAt.getTime()).toBeGreaterThanOrEqual(beforeTimestamp.getTime());

              // Verify round timestamps are ordered
              if (updatedMatch.rounds.length > 1) {
                for (let i = 1; i < updatedMatch.rounds.length; i++) {
                  expect(updatedMatch.rounds[i].timestamp.getTime()).toBeGreaterThanOrEqual(
                    updatedMatch.rounds[i - 1].timestamp.getTime(),
                  );
                }
              }

              currentMatch = updatedMatch;
            }
          },
        ),
        { numRuns: 5 },
      );
    });
  });
});
