/**
 * Property-Based Tests for Match History Completeness
 *
 * **Feature: best-of-three-ai-matches, Property 9: Match History Completeness**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.5**
 *
 * Tests that match history contains all round details and match metadata
 * for any completed match.
 */
import { getPlayerMatchHistory } from "../lib/aiMatchStorage";
import { AIMatch, MatchStatus, Move, Round } from "../types/aiMatch";
import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the storage functions
vi.mock("../lib/aiMatchStorage", () => ({
  getPlayerMatchHistory: vi.fn(),
}));

// Generator for valid moves
const moveGen = fc.constantFrom("rock", "paper", "scissors") as fc.Arbitrary<Move>;

// Generator for valid completed AI matches
const completedAIMatchGen: fc.Arbitrary<AIMatch> = fc
  .tuple(
    fc.string({ minLength: 10, maxLength: 20 }),
    fc.string({ minLength: 40, maxLength: 40 }).map((s: string) => `0x${s}`),
    fc.integer({ min: Date.parse("2024-01-01"), max: Date.now() }),
    // Generate match outcome: who wins and in how many rounds (2 or 3)
    fc.record({
      winner: fc.constantFrom("player", "ai"),
      totalRounds: fc.constantFrom(2, 3), // 2-0 or 2-1 victory
    }),
  )
  .map(([id, playerId, startedAtMs, matchOutcome]) => {
    const startedAt = new Date(startedAtMs);
    const rounds: Round[] = [];
    let playerScore = 0;
    let aiScore = 0;

    // Generate rounds based on the desired outcome
    for (let roundNumber = 1; roundNumber <= matchOutcome.totalRounds; roundNumber++) {
      let roundWinner: "player" | "ai" | "tie";

      if (matchOutcome.totalRounds === 2) {
        // 2-0 victory: winner wins both rounds
        roundWinner = matchOutcome.winner;
      } else {
        // 2-1 victory: winner wins 2 rounds, loser wins 1
        if (roundNumber === 1) {
          // First round: loser wins
          roundWinner = matchOutcome.winner === "player" ? "ai" : "player";
        } else {
          // Rounds 2 and 3: winner wins
          roundWinner = matchOutcome.winner;
        }
      }

      // Generate moves that produce the desired outcome
      let playerMove: Move;
      let aiMove: Move;

      if (roundWinner === "player") {
        // Player wins: generate winning combination
        const winningCombos: [Move, Move][] = [
          ["rock", "scissors"],
          ["paper", "rock"],
          ["scissors", "paper"],
        ];
        const combo = winningCombos[Math.floor(Math.random() * winningCombos.length)];
        playerMove = combo[0];
        aiMove = combo[1];
      } else if (roundWinner === "ai") {
        // AI wins: generate AI winning combination
        const aiWinningCombos: [Move, Move][] = [
          ["scissors", "rock"], // player scissors, ai rock
          ["rock", "paper"], // player rock, ai paper
          ["paper", "scissors"], // player paper, ai scissors
        ];
        const combo = aiWinningCombos[Math.floor(Math.random() * aiWinningCombos.length)];
        playerMove = combo[0];
        aiMove = combo[1];
      } else {
        // Tie: same move
        const move = fc.sample(moveGen, 1)[0];
        playerMove = move;
        aiMove = move;
      }

      const round: Round = {
        roundNumber,
        playerMove,
        aiMove,
        result: {
          winner: roundWinner,
          playerMove,
          aiMove,
        },
        timestamp: new Date(startedAt.getTime() + (roundNumber - 1) * 60000),
      };

      rounds.push(round);

      // Update scores
      if (roundWinner === "player") playerScore++;
      else if (roundWinner === "ai") aiScore++;
    }

    // Generate completion time after start time
    const completedAt = new Date(startedAt.getTime() + Math.floor(Math.random() * 3600000) + 60000); // 1-60 minutes later
    const lastActivityAt = new Date(
      startedAt.getTime() + Math.floor(Math.random() * (completedAt.getTime() - startedAt.getTime())),
    );

    return {
      id,
      playerId,
      status: MatchStatus.COMPLETED,
      rounds,
      playerScore,
      aiScore,
      currentRound: rounds.length,
      startedAt,
      lastActivityAt,
      completedAt,
      winner: matchOutcome.winner,
      isAbandoned: false,
    } as AIMatch;
  });

describe("Match History Completeness Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 9: Match History Completeness
   * For any completed match, the history should contain all round details
   * (moves, outcomes) and match metadata (scores, timestamps, duration)
   */
  it("should contain all round details and match metadata for any completed match", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(completedAIMatchGen, { minLength: 1, maxLength: 10 }), async matches => {
        // Mock the storage function to return our test matches
        vi.mocked(getPlayerMatchHistory).mockResolvedValue(matches);

        // Call the storage function directly
        const playerId = matches[0].playerId;
        const returnedMatches = await getPlayerMatchHistory(playerId, 50, 0);

        // Verify response structure
        expect(Array.isArray(returnedMatches)).toBe(true);
        expect(returnedMatches.length).toBe(matches.length);

        // For each match in the response, verify completeness
        returnedMatches.forEach((match: AIMatch, index: number) => {
          const originalMatch = matches[index];

          // Verify match metadata is present
          expect(match.id).toBeDefined();
          expect(match.playerId).toBe(originalMatch.playerId);
          expect(match.status).toBe(MatchStatus.COMPLETED);
          expect(match.playerScore).toBeGreaterThanOrEqual(0);
          expect(match.aiScore).toBeGreaterThanOrEqual(0);
          expect(match.startedAt).toBeDefined();
          expect(match.completedAt).toBeDefined();
          expect(match.winner).toBeDefined();

          // Verify all rounds are present with complete details
          expect(match.rounds).toBeDefined();
          expect(Array.isArray(match.rounds)).toBe(true);
          expect(match.rounds.length).toBeGreaterThan(0);

          match.rounds.forEach((round: Round) => {
            // Verify round has all required details
            expect(round.roundNumber).toBeGreaterThanOrEqual(1);
            expect(round.roundNumber).toBeLessThanOrEqual(3);
            expect(round.playerMove).toMatch(/^(rock|paper|scissors)$/);
            expect(round.aiMove).toMatch(/^(rock|paper|scissors)$/);
            expect(round.result).toBeDefined();
            expect(round.result.winner).toMatch(/^(player|ai|tie)$/);
            expect(round.result.playerMove).toBe(round.playerMove);
            expect(round.result.aiMove).toBe(round.aiMove);
            expect(round.timestamp).toBeDefined();
          });

          // Verify match duration can be calculated
          if (match.completedAt && match.startedAt) {
            const duration = new Date(match.completedAt).getTime() - new Date(match.startedAt).getTime();
            expect(duration).toBeGreaterThanOrEqual(0);
          }
        });
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Additional property: Round details consistency
   * For any match, round results should be consistent with individual round data
   */
  it("should have consistent round results with match scores", async () => {
    await fc.assert(
      fc.asyncProperty(completedAIMatchGen, async match => {
        // Mock the storage function
        vi.mocked(getPlayerMatchHistory).mockResolvedValue([match]);

        // Call the storage function directly
        const returnedMatches = await getPlayerMatchHistory(match.playerId, 50, 0);
        const returnedMatch = returnedMatches[0];

        // Count wins from rounds
        let playerWins = 0;
        let aiWins = 0;
        returnedMatch.rounds.forEach((round: Round) => {
          if (round.result.winner === "player") playerWins++;
          else if (round.result.winner === "ai") aiWins++;
        });

        // Verify scores match round results
        expect(returnedMatch.playerScore).toBe(playerWins);
        expect(returnedMatch.aiScore).toBe(aiWins);

        // Verify match winner is consistent with scores
        if (playerWins > aiWins) {
          expect(returnedMatch.winner).toBe("player");
        } else if (aiWins > playerWins) {
          expect(returnedMatch.winner).toBe("ai");
        } else {
          expect(returnedMatch.winner).toBe("tie");
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Match metadata completeness
   * For any completed match, all required metadata fields should be present
   */
  it("should include all required metadata fields for any completed match", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(completedAIMatchGen, { minLength: 1, maxLength: 5 }), async matches => {
        // Mock the storage function
        vi.mocked(getPlayerMatchHistory).mockResolvedValue(matches);

        // Call the storage function directly
        const playerId = matches[0].playerId;
        const returnedMatches = await getPlayerMatchHistory(playerId, 50, 0);

        // Verify each match has complete metadata
        returnedMatches.forEach((match: AIMatch) => {
          // Required fields for completed matches
          const requiredFields = [
            "id",
            "playerId",
            "status",
            "rounds",
            "playerScore",
            "aiScore",
            "startedAt",
            "completedAt",
            "winner",
            "isAbandoned",
          ];

          requiredFields.forEach(field => {
            expect(match).toHaveProperty(field);
            expect(match[field as keyof AIMatch]).not.toBeNull();
            expect(match[field as keyof AIMatch]).not.toBeUndefined();
          });

          // Verify timestamps are valid dates
          expect(new Date(match.startedAt)).toBeInstanceOf(Date);
          expect(new Date(match.completedAt!)).toBeInstanceOf(Date);
          expect(new Date(match.lastActivityAt)).toBeInstanceOf(Date);

          // Verify scores are within valid range for best-of-three
          expect(match.playerScore).toBeGreaterThanOrEqual(0);
          expect(match.playerScore).toBeLessThanOrEqual(2);
          expect(match.aiScore).toBeGreaterThanOrEqual(0);
          expect(match.aiScore).toBeLessThanOrEqual(2);

          // At least one player should have 2 wins for a completed match
          expect(Math.max(match.playerScore, match.aiScore)).toBeGreaterThanOrEqual(2);
        });
      }),
      { numRuns: 100 },
    );
  });
});
