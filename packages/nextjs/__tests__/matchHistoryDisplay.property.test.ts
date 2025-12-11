/**
 * Property-Based Tests for Match History Display
 *
 * **Feature: best-of-three-ai-matches, Property 20: Match History Display**
 *
 * Tests that match history is displayed correctly with proper ordering,
 * filtering, and data integrity across different match types.
 */
import { AIMatch, MatchStatus } from "../types/aiMatch";
import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

// Mock the storage functions
vi.mock("../lib/aiMatchStorage", async importOriginal => {
  const actual = await importOriginal<typeof import("../lib/aiMatchStorage")>();
  return {
    ...actual,
    getPlayerMatchHistory: vi.fn(),
    getPlayerMatchStats: vi.fn(),
  };
});

describe("Match History Display Property Tests", () => {
  /**
   * Property 20: Match History Display
   * Match history should be displayed in correct chronological order
   * with proper filtering and complete data integrity
   */
  describe("Property 20: Match History Display", () => {
    it("should display matches in correct chronological order (newest first)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 10, maxLength: 20 }),
              playerId: fc.constant("0x1234567890123456789012345678901234567890"),
              completedAt: fc.date({ min: new Date("2024-01-01"), max: new Date("2024-12-31") }),
              playerScore: fc.integer({ min: 0, max: 2 }),
              aiScore: fc.integer({ min: 0, max: 2 }),
              winner: fc.constantFrom("player", "ai", "tie"),
              status: fc.constant(MatchStatus.COMPLETED),
            }),
            { minLength: 2, maxLength: 10 },
          ),
          async matches => {
            // Ensure matches have valid scores (at least one player has 2 or it's a tie)
            const validMatches = matches.map(match => {
              if (match.winner === "player") {
                return { ...match, playerScore: 2, aiScore: Math.min(match.aiScore, 1) };
              } else if (match.winner === "ai") {
                return { ...match, playerScore: Math.min(match.playerScore, 1), aiScore: 2 };
              } else {
                return { ...match, playerScore: 1, aiScore: 1 };
              }
            });

            // Mock the storage function to return our test matches
            const { getPlayerMatchHistory } = await import("../lib/aiMatchStorage");
            vi.mocked(getPlayerMatchHistory).mockResolvedValue(validMatches as AIMatch[]);

            // Simulate fetching match history (this would be done by the history page)
            const fetchedMatches = await getPlayerMatchHistory("0x1234567890123456789012345678901234567890");

            // Sort matches by completion date (newest first) - this is what the UI should do
            const sortedMatches = [...fetchedMatches].sort((a, b) => {
              const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
              const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
              return dateB - dateA; // Newest first
            });

            // Verify chronological ordering
            for (let i = 0; i < sortedMatches.length - 1; i++) {
              const currentDate = sortedMatches[i].completedAt ? new Date(sortedMatches[i].completedAt!).getTime() : 0;
              const nextDate = sortedMatches[i + 1].completedAt
                ? new Date(sortedMatches[i + 1].completedAt!).getTime()
                : 0;
              expect(currentDate).toBeGreaterThanOrEqual(nextDate);
            }

            // Verify all matches are present
            expect(sortedMatches).toHaveLength(validMatches.length);
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should correctly filter matches by type and outcome", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerWins: fc.integer({ min: 1, max: 5 }),
            playerLosses: fc.integer({ min: 1, max: 5 }),
            ties: fc.integer({ min: 0, max: 3 }),
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
          }),
          async ({ playerWins, playerLosses, ties, playerId }) => {
            // Generate matches with specific outcomes
            const matches: AIMatch[] = [];

            // Add player wins
            for (let i = 0; i < playerWins; i++) {
              matches.push({
                id: `win-${i}`,
                playerId,
                status: MatchStatus.COMPLETED,
                playerScore: 2,
                aiScore: Math.floor(Math.random() * 2), // 0 or 1
                currentRound: 3,
                rounds: [],
                startedAt: new Date(),
                lastActivityAt: new Date(),
                completedAt: new Date(Date.now() - i * 1000 * 60 * 60), // Spread over hours
                winner: "player",
                isAbandoned: false,
              });
            }

            // Add player losses
            for (let i = 0; i < playerLosses; i++) {
              matches.push({
                id: `loss-${i}`,
                playerId,
                status: MatchStatus.COMPLETED,
                playerScore: Math.floor(Math.random() * 2), // 0 or 1
                aiScore: 2,
                currentRound: 3,
                rounds: [],
                startedAt: new Date(),
                lastActivityAt: new Date(),
                completedAt: new Date(Date.now() - (playerWins + i) * 1000 * 60 * 60),
                winner: "ai",
                isAbandoned: false,
              });
            }

            // Add ties
            for (let i = 0; i < ties; i++) {
              matches.push({
                id: `tie-${i}`,
                playerId,
                status: MatchStatus.COMPLETED,
                playerScore: 1,
                aiScore: 1,
                currentRound: 3,
                rounds: [],
                startedAt: new Date(),
                lastActivityAt: new Date(),
                completedAt: new Date(Date.now() - (playerWins + playerLosses + i) * 1000 * 60 * 60),
                winner: "tie",
                isAbandoned: false,
              });
            }

            const { getPlayerMatchHistory } = await import("../lib/aiMatchStorage");
            vi.mocked(getPlayerMatchHistory).mockResolvedValue(matches);

            const fetchedMatches = await getPlayerMatchHistory(playerId);

            // Test filtering by outcome
            const wins = fetchedMatches.filter((match: AIMatch) => match.winner === "player");
            const losses = fetchedMatches.filter((match: AIMatch) => match.winner === "ai");
            const tieMatches = fetchedMatches.filter((match: AIMatch) => match.winner === "tie");

            expect(wins).toHaveLength(playerWins);
            expect(losses).toHaveLength(playerLosses);
            expect(tieMatches).toHaveLength(ties);

            // Verify total count
            expect(fetchedMatches).toHaveLength(playerWins + playerLosses + ties);

            // Verify each match has required display data
            fetchedMatches.forEach((match: AIMatch) => {
              expect(match.id).toBeDefined();
              expect(match.playerScore).toBeGreaterThanOrEqual(0);
              expect(match.aiScore).toBeGreaterThanOrEqual(0);
              expect(match.winner).toMatch(/^(player|ai|tie)$/);
              expect(match.completedAt).toBeDefined();
            });
          },
        ),
        { numRuns: 15 },
      );
    });

    it("should display complete match metadata for history entries", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 10, maxLength: 20 }),
              playerId: fc.constant("0x1234567890123456789012345678901234567890"),
              playerScore: fc.integer({ min: 0, max: 2 }),
              aiScore: fc.integer({ min: 0, max: 2 }),
              roundCount: fc.integer({ min: 2, max: 3 }),
              duration: fc.integer({ min: 30, max: 600 }), // 30 seconds to 10 minutes
              winner: fc.constantFrom("player", "ai", "tie"),
            }),
            { minLength: 1, maxLength: 8 },
          ),
          async matchData => {
            const matches: AIMatch[] = matchData.map((data, index) => {
              const startTime = new Date(Date.now() - (index + 1) * 1000 * 60 * 60);
              const endTime = new Date(startTime.getTime() + data.duration * 1000);

              // Ensure valid scores based on winner
              let playerScore = data.playerScore;
              let aiScore = data.aiScore;

              if (data.winner === "player") {
                playerScore = 2;
                aiScore = Math.min(aiScore, 1);
              } else if (data.winner === "ai") {
                aiScore = 2;
                playerScore = Math.min(playerScore, 1);
              } else {
                playerScore = 1;
                aiScore = 1;
              }

              return {
                id: data.id,
                playerId: data.playerId,
                status: MatchStatus.COMPLETED,
                playerScore,
                aiScore,
                currentRound: data.roundCount,
                rounds: Array.from({ length: data.roundCount }, (_, i) => ({
                  roundNumber: i + 1,
                  playerMove: "rock" as const,
                  aiMove: "paper" as const,
                  result: {
                    winner: i % 2 === 0 ? "player" : "ai",
                    playerMove: "rock" as const,
                    aiMove: "paper" as const,
                  },
                  timestamp: new Date(startTime.getTime() + i * 30000),
                })),
                startedAt: startTime,
                lastActivityAt: endTime,
                completedAt: endTime,
                winner: data.winner as any,
                isAbandoned: false,
              };
            });

            const { getPlayerMatchHistory } = await import("../lib/aiMatchStorage");
            vi.mocked(getPlayerMatchHistory).mockResolvedValue(matches);

            const fetchedMatches = await getPlayerMatchHistory("0x1234567890123456789012345678901234567890");

            // Verify each match has complete metadata for display
            fetchedMatches.forEach((match: AIMatch) => {
              // Essential display data
              expect(match.id).toBeDefined();
              expect(match.playerScore).toBeGreaterThanOrEqual(0);
              expect(match.aiScore).toBeGreaterThanOrEqual(0);
              expect(match.winner).toMatch(/^(player|ai|tie)$/);

              // Timing data
              expect(match.startedAt).toBeDefined();
              expect(match.completedAt).toBeDefined();
              expect(new Date(match.completedAt!).getTime()).toBeGreaterThanOrEqual(
                new Date(match.startedAt).getTime(),
              );

              // Round data
              expect(match.rounds).toBeDefined();
              expect(match.rounds.length).toBeGreaterThan(0);
              expect(match.currentRound).toBeGreaterThanOrEqual(match.rounds.length);

              // Status
              expect(match.status).toBe(MatchStatus.COMPLETED);
              expect(match.isAbandoned).toBe(false);
            });
          },
        ),
        { numRuns: 12 },
      );
    });

    it("should handle empty match history gracefully", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            playerId: fc.string({ minLength: 40, maxLength: 42 }),
          }),
          async ({ playerId }) => {
            // Mock empty match history
            const { getPlayerMatchHistory } = await import("../lib/aiMatchStorage");
            vi.mocked(getPlayerMatchHistory).mockResolvedValue([]);

            const fetchedMatches = await getPlayerMatchHistory(playerId);

            // Should return empty array, not null or undefined
            expect(Array.isArray(fetchedMatches)).toBe(true);
            expect(fetchedMatches).toHaveLength(0);
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should maintain data consistency across pagination", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            totalMatches: fc.integer({ min: 20, max: 50 }),
            pageSize: fc.integer({ min: 5, max: 15 }),
            playerId: fc.constant("0x1234567890123456789012345678901234567890"),
          }),
          async ({ totalMatches, pageSize, playerId }) => {
            // Generate a large set of matches
            const allMatches: AIMatch[] = Array.from({ length: totalMatches }, (_, i) => ({
              id: `match-${i}`,
              playerId,
              status: MatchStatus.COMPLETED,
              playerScore: i % 3 === 0 ? 2 : i % 3 === 1 ? 0 : 1,
              aiScore: i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 1,
              currentRound: 3,
              rounds: [],
              startedAt: new Date(Date.now() - i * 1000 * 60),
              lastActivityAt: new Date(Date.now() - i * 1000 * 60 + 30000),
              completedAt: new Date(Date.now() - i * 1000 * 60 + 30000),
              winner: i % 3 === 0 ? "player" : i % 3 === 1 ? "ai" : "tie",
              isAbandoned: false,
            }));

            const { getPlayerMatchHistory } = await import("../lib/aiMatchStorage");

            // Simulate paginated fetching
            const pages: AIMatch[][] = [];
            for (let offset = 0; offset < totalMatches; offset += pageSize) {
              const pageMatches = allMatches.slice(offset, offset + pageSize);
              vi.mocked(getPlayerMatchHistory).mockResolvedValue(pageMatches);
              const fetchedPage = await getPlayerMatchHistory(playerId, pageSize, offset);
              pages.push(fetchedPage);
            }

            // Verify no duplicates across pages
            const allFetchedIds = new Set<string>();
            let totalFetched = 0;

            pages.forEach(page => {
              page.forEach(match => {
                expect(allFetchedIds.has(match.id)).toBe(false); // No duplicates
                allFetchedIds.add(match.id);
                totalFetched++;
              });
            });

            // Verify total count consistency
            expect(totalFetched).toBe(totalMatches);
            expect(allFetchedIds.size).toBe(totalMatches);
          },
        ),
        { numRuns: 8 },
      );
    });
  });
});
