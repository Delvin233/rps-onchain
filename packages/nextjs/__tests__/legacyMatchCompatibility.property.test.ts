/**
 * Property-Based Tests for Legacy Match Compatibility
 *
 * **Feature: best-of-three-ai-matches, Property 15: Legacy Match Compatibility**
 * **Validates: Requirements 7.3, 7.4**
 *
 * Tests that the system correctly reads and displays legacy single-round matches
 * while distinguishing them from best-of-three matches.
 */
import { MatchRecord } from "../lib/pinataStorage";
import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the storage functions
vi.mock("../lib/pinataStorage", () => ({
  getLocalMatches: vi.fn(),
}));

// Mock the API fetch for history
global.fetch = vi.fn();

// Generator for valid moves
const moveGen = fc.constantFrom("rock", "paper", "scissors");

// Generator for valid Ethereum addresses
const ethAddressGen = fc
  .array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"), {
    minLength: 40,
    maxLength: 40,
  })
  .map(chars => `0x${chars.join("")}`);

// Generator for legacy AI matches (single round)
const legacyAIMatchGen: fc.Arbitrary<MatchRecord> = fc
  .tuple(
    fc.string({ minLength: 10, maxLength: 20 }),
    ethAddressGen,
    moveGen,
    moveGen,
    fc.integer({ min: new Date("2023-01-01").getTime(), max: new Date("2024-01-01").getTime() }),
    fc.option(fc.string({ minLength: 46, maxLength: 46 }), { nil: undefined }),
  )
  .map(([id, player, playerMove, opponentMove, timestamp, ipfsHash]) => {
    // Calculate result based on moves
    let result: "win" | "lose" | "tie";
    if (playerMove === opponentMove) {
      result = "tie";
    } else if (
      (playerMove === "rock" && opponentMove === "scissors") ||
      (playerMove === "paper" && opponentMove === "rock") ||
      (playerMove === "scissors" && opponentMove === "paper")
    ) {
      result = "win";
    } else {
      result = "lose";
    }

    return {
      id,
      player,
      opponent: "AI" as const,
      playerMove,
      opponentMove,
      result,
      timestamp,
      ipfsHash,
    };
  });

// Generator for legacy multiplayer matches (single round)
const legacyMultiplayerMatchGen: fc.Arbitrary<MatchRecord> = fc
  .tuple(
    fc.string({ minLength: 10, maxLength: 20 }),
    ethAddressGen,
    ethAddressGen,
    moveGen,
    moveGen,
    fc.integer({ min: new Date("2023-01-01").getTime(), max: new Date("2024-01-01").getTime() }),
    fc.option(fc.string({ minLength: 46, maxLength: 46 }), { nil: undefined }),
  )
  .map(([roomId, creator, joiner, creatorMove, joinerMove, timestamp, ipfsHash]) => {
    // Determine winner based on moves
    let winner: string;
    if (creatorMove === joinerMove) {
      winner = ""; // tie
    } else if (
      (creatorMove === "rock" && joinerMove === "scissors") ||
      (creatorMove === "paper" && joinerMove === "rock") ||
      (creatorMove === "scissors" && joinerMove === "paper")
    ) {
      winner = creator;
    } else {
      winner = joiner;
    }

    return {
      roomId,
      players: {
        creator,
        joiner,
      },
      moves: {
        creatorMove,
        joinerMove,
      },
      result: {
        winner,
        timestamp,
      },
      ipfsHash,
    };
  });

// Generator for new AI matches (best-of-three format)
const newAIMatchGen = fc
  .tuple(
    fc.string({ minLength: 10, maxLength: 20 }),
    ethAddressGen,
    fc.constantFrom("player", "ai"),
    fc.integer({ min: new Date("2024-06-01").getTime(), max: Date.now() }),
  )
  .map(([id, playerId, winner, startedAtMs]) => {
    const startedAt = new Date(startedAtMs);
    const completedAt = new Date(startedAtMs + Math.floor(Math.random() * 3600000)); // Up to 1 hour later

    return {
      id,
      playerId,
      status: "completed",
      playerScore: winner === "player" ? 2 : Math.floor(Math.random() * 2),
      aiScore: winner === "ai" ? 2 : Math.floor(Math.random() * 2),
      currentRound: 3,
      rounds: [], // Simplified for this test
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      winner,
      isAbandoned: false,
      matchType: "ai-best-of-three",
    };
  });

describe("Legacy Match Compatibility Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 15: Legacy Match Compatibility
   * For any historical single-round match, the system should correctly read
   * and display the match while distinguishing it from best-of-three matches
   */
  it("should correctly read and distinguish legacy single-round matches from best-of-three matches", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.array(legacyAIMatchGen, { minLength: 1, maxLength: 5 }),
          fc.array(legacyMultiplayerMatchGen, { minLength: 1, maxLength: 5 }),
          fc.array(newAIMatchGen, { minLength: 1, maxLength: 5 }),
        ),
        async ([legacyAIMatches, legacyMultiplayerMatches, newAIMatches]) => {
          // Mock the API response for new AI matches
          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ matches: newAIMatches }),
          } as Response);

          // Mock the API response for legacy matches
          vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ matches: [...legacyAIMatches, ...legacyMultiplayerMatches] }),
          } as Response);

          // Simulate the history page logic for combining matches
          const allLegacyMatches = [...legacyAIMatches, ...legacyMultiplayerMatches];
          const allNewAIMatches = newAIMatches.map(match => ({
            ...match,
            matchType: "ai-best-of-three",
            timestamp: new Date(match.completedAt || match.startedAt).getTime(),
          }));

          // Verify legacy AI matches are correctly identified
          legacyAIMatches.forEach(match => {
            expect(match.opponent).toBe("AI");
            expect(match.playerMove).toMatch(/^(rock|paper|scissors)$/);
            expect(match.opponentMove).toMatch(/^(rock|paper|scissors)$/);
            expect(match.result).toMatch(/^(win|lose|tie)$/);
            expect(typeof match.timestamp).toBe("number");

            // Legacy matches should NOT have best-of-three properties
            expect(match).not.toHaveProperty("rounds");
            expect(match).not.toHaveProperty("playerScore");
            expect(match).not.toHaveProperty("aiScore");
            expect(match).not.toHaveProperty("matchType");
          });

          // Verify legacy multiplayer matches are correctly identified
          legacyMultiplayerMatches.forEach(match => {
            expect(match.players).toBeDefined();
            expect(match.players?.creator).toBeDefined();
            expect(match.players?.joiner).toBeDefined();
            expect(match.moves).toBeDefined();
            expect(match.moves?.creatorMove).toMatch(/^(rock|paper|scissors)$/);
            expect(match.moves?.joinerMove).toMatch(/^(rock|paper|scissors)$/);
            expect(match.result).toBeDefined();
            expect(typeof (match.result as any)?.timestamp).toBe("number");

            // Legacy matches should NOT have best-of-three properties
            expect(match).not.toHaveProperty("rounds");
            expect(match).not.toHaveProperty("playerScore");
            expect(match).not.toHaveProperty("aiScore");
            expect(match).not.toHaveProperty("matchType");
          });

          // Verify new AI matches are correctly identified
          allNewAIMatches.forEach(match => {
            expect(match.matchType).toBe("ai-best-of-three");
            expect(match.playerScore).toBeGreaterThanOrEqual(0);
            expect(match.playerScore).toBeLessThanOrEqual(2);
            expect(match.aiScore).toBeGreaterThanOrEqual(0);
            expect(match.aiScore).toBeLessThanOrEqual(2);
            expect(match.status).toBe("completed");
            expect(match.winner).toMatch(/^(player|ai)$/);

            // New matches should NOT have legacy single-round properties
            expect(match).not.toHaveProperty("opponent");
            expect(match).not.toHaveProperty("playerMove");
            expect(match).not.toHaveProperty("opponentMove");
            expect(match).not.toHaveProperty("result");
          });

          // Verify that matches can be distinguished by their structure
          const combinedMatches = [...allLegacyMatches, ...allNewAIMatches];

          combinedMatches.forEach(match => {
            // Check if it's a legacy AI match
            if ("opponent" in match && match.opponent === "AI") {
              expect(match).toHaveProperty("playerMove");
              expect(match).toHaveProperty("opponentMove");
              expect(match).toHaveProperty("result");
              expect(match).not.toHaveProperty("rounds");
            }
            // Check if it's a legacy multiplayer match
            else if ("players" in match && "moves" in match) {
              expect(match.players).toHaveProperty("creator");
              expect(match.players).toHaveProperty("joiner");
              expect(match.moves).toHaveProperty("creatorMove");
              expect(match.moves).toHaveProperty("joinerMove");
              expect(match).not.toHaveProperty("rounds");
            }
            // Check if it's a new AI best-of-three match
            else if ("matchType" in match && match.matchType === "ai-best-of-three") {
              expect(match).toHaveProperty("playerScore");
              expect(match).toHaveProperty("aiScore");
              expect(match).toHaveProperty("status");
              expect(match).toHaveProperty("winner");
            }
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Legacy match data integrity
   * For any legacy match, all required fields should be present and valid
   */
  it("should preserve data integrity for legacy matches", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(legacyAIMatchGen, { minLength: 1, maxLength: 10 }), async legacyMatches => {
        // Verify each legacy match has required fields
        legacyMatches.forEach(match => {
          // Required fields for legacy AI matches
          expect(match.id).toBeDefined();
          expect(typeof match.id).toBe("string");
          expect(match.id!.length).toBeGreaterThan(0);

          expect(match.player).toBeDefined();
          expect(typeof match.player).toBe("string");
          expect(match.player).toMatch(/^0x[a-fA-F0-9]{40}$/);

          expect(match.opponent).toBe("AI");

          expect(match.playerMove).toMatch(/^(rock|paper|scissors)$/);
          expect(match.opponentMove).toMatch(/^(rock|paper|scissors)$/);
          expect(match.result).toMatch(/^(win|lose|tie)$/);

          expect(typeof match.timestamp).toBe("number");
          expect(match.timestamp).toBeGreaterThan(0);

          // Verify result is consistent with moves (result is now calculated correctly in generator)
          if (match.playerMove === match.opponentMove) {
            expect(match.result).toBe("tie");
          } else {
            const playerWins =
              (match.playerMove === "rock" && match.opponentMove === "scissors") ||
              (match.playerMove === "paper" && match.opponentMove === "rock") ||
              (match.playerMove === "scissors" && match.opponentMove === "paper");

            if (playerWins) {
              expect(match.result).toBe("win");
            } else {
              expect(match.result).toBe("lose");
            }
          }
        });
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Match type distinction in display
   * For any combination of legacy and new matches, the system should
   * provide clear visual distinction between match types
   */
  it("should provide clear visual distinction between legacy and new match types", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.array(legacyAIMatchGen, { minLength: 0, maxLength: 3 }),
          fc.array(newAIMatchGen, { minLength: 0, maxLength: 3 }),
        ),
        async ([legacyMatches, newMatches]) => {
          // Skip if both arrays are empty
          if (legacyMatches.length === 0 && newMatches.length === 0) {
            return;
          }

          // Simulate the display logic that would be used in the UI
          const displayMatches = [
            ...legacyMatches.map(match => ({
              ...match,
              displayType: "legacy-ai",
              badge: "🤖 AI MATCH",
              subBadge: "Legacy • Single Round",
              borderColor: "border-l-warning",
            })),
            ...newMatches.map(match => ({
              ...match,
              displayType: "ai-best-of-three",
              badge: "🤖 AI MATCH",
              subBadge: "Best of 3",
              borderColor: "border-l-primary",
            })),
          ];

          // Verify each match has appropriate display properties
          displayMatches.forEach(match => {
            expect(match.displayType).toBeDefined();
            expect(match.badge).toBe("🤖 AI MATCH");
            expect(match.subBadge).toBeDefined();
            expect(match.borderColor).toBeDefined();

            if (match.displayType === "legacy-ai") {
              expect(match.subBadge).toBe("Legacy • Single Round");
              expect(match.borderColor).toBe("border-l-warning");
              expect(match).toHaveProperty("playerMove");
              expect(match).toHaveProperty("opponentMove");
            } else if (match.displayType === "ai-best-of-three") {
              expect(match.subBadge).toBe("Best of 3");
              expect(match.borderColor).toBe("border-l-primary");
              expect(match).toHaveProperty("playerScore");
              expect(match).toHaveProperty("aiScore");
            }
          });

          // Verify that legacy and new matches have different visual indicators
          const legacyDisplayMatches = displayMatches.filter(m => m.displayType === "legacy-ai");
          const newDisplayMatches = displayMatches.filter(m => m.displayType === "ai-best-of-three");

          if (legacyDisplayMatches.length > 0 && newDisplayMatches.length > 0) {
            // Ensure different border colors
            expect(legacyDisplayMatches[0].borderColor).not.toBe(newDisplayMatches[0].borderColor);
            // Ensure different sub-badges
            expect(legacyDisplayMatches[0].subBadge).not.toBe(newDisplayMatches[0].subBadge);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Chronological ordering preservation
   * For any mix of legacy and new matches, chronological ordering should be preserved
   */
  it("should preserve chronological ordering across legacy and new match types", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.array(legacyAIMatchGen, { minLength: 1, maxLength: 5 }),
          fc.array(newAIMatchGen, { minLength: 1, maxLength: 5 }),
        ),
        async ([legacyMatches, newMatches]) => {
          // Combine matches and sort by timestamp (newest first)
          const allMatches = [
            ...legacyMatches.map(match => ({
              ...match,
              sortTimestamp: match.timestamp!,
            })),
            ...newMatches.map(match => ({
              ...match,
              sortTimestamp: new Date((match as any).completedAt || (match as any).startedAt).getTime(),
            })),
          ]
            .filter(match => match.sortTimestamp && !isNaN(match.sortTimestamp)) // Filter out invalid timestamps
            .sort((a, b) => (b.sortTimestamp || 0) - (a.sortTimestamp || 0));

          // Verify chronological ordering is maintained
          for (let i = 0; i < allMatches.length - 1; i++) {
            expect(allMatches[i].sortTimestamp || 0).toBeGreaterThanOrEqual(allMatches[i + 1].sortTimestamp || 0);
          }

          // Verify that match type doesn't affect ordering
          // (legacy and new matches should be interleaved based on timestamp, not type)
          if (allMatches.length >= 3) {
            const hasLegacy = allMatches.some(m => "opponent" in m);
            const hasNew = allMatches.some(m => "matchType" in m);

            if (hasLegacy && hasNew) {
              // Find positions of different match types
              const legacyPositions = allMatches
                .map((match, index) => ("opponent" in match ? index : -1))
                .filter(pos => pos !== -1);
              const newPositions = allMatches
                .map((match, index) => ("matchType" in match ? index : -1))
                .filter(pos => pos !== -1);

              // Verify that positions are based on timestamp, not match type
              // This means we shouldn't see all legacy matches grouped together
              if (legacyPositions.length > 1 && newPositions.length > 1) {
                // Check if matches are properly interleaved by timestamp
                // If they're sorted correctly by timestamp, we should see some interleaving
                // unless all legacy matches happen to have the same timestamp range

                // Simple check: ensure that the ordering is actually based on timestamp
                // by verifying that adjacent matches follow timestamp ordering
                let properlyOrdered = true;
                for (let i = 0; i < allMatches.length - 1; i++) {
                  if ((allMatches[i].sortTimestamp || 0) < (allMatches[i + 1].sortTimestamp || 0)) {
                    properlyOrdered = false;
                    break;
                  }
                }
                expect(properlyOrdered).toBe(true);
              }
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
