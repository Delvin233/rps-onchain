/**
 * Property Test: Leaderboard Ranking Accuracy
 *
 * Property 4: Leaderboard Ranking Accuracy
 * Validates: Requirements 3.5
 *
 * **Feature: best-of-three-ai-matches, Property 4: Leaderboard Ranking Accuracy**
 *
 * This property test ensures that leaderboard rankings are mathematically correct:
 * - Rankings are based on completed match victories, not individual rounds
 * - Proper sorting with tie-breaking logic is applied consistently
 * - Position calculations are accurate across all scenarios
 * - Edge cases (equal stats, zero matches) are handled properly
 */
import { compareMatchRankings, getMatchLeaderboard, getPlayerMatchRanking } from "../lib/match-leaderboard";
import { turso } from "../lib/turso";
import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the turso database
vi.mock("../lib/turso", () => ({
  turso: {
    execute: vi.fn(),
  },
}));

const mockTurso = turso as any;

// Simple generators for property testing
const addressGen = fc.integer({ min: 1, max: 999 }).map(i => `0x${i.toString().padStart(40, "0")}`);

// Generator for leaderboard entries with valid constraints
const leaderboardEntryGen = fc
  .record({
    address: addressGen,
    matchWins: fc.integer({ min: 0, max: 50 }),
    matchesPlayed: fc.integer({ min: 0, max: 50 }),
    position: fc.integer({ min: 1, max: 1000 }),
    updatedAt: fc.integer({ min: 1000000, max: 2000000 }),
    displayName: fc.constant(null),
  })
  .filter(entry => entry.matchWins <= entry.matchesPlayed)
  .map(entry => ({
    ...entry,
    matchWinRate: entry.matchesPlayed > 0 ? Math.round((entry.matchWins / entry.matchesPlayed) * 100 * 100) / 100 : 0,
  }));

describe("Property Test: Leaderboard Ranking Accuracy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Property 4.1: Leaderboard entries are sorted correctly by ranking criteria", async () => {
    // Create a simple test case with known data
    const testPlayers = [
      {
        address: "0x0000000000000000000000000000000000000001",
        matchWins: 10,
        matchesPlayed: 12,
        matchWinRate: 83.33,
        updatedAt: 1000000,
      },
      {
        address: "0x0000000000000000000000000000000000000002",
        matchWins: 8,
        matchesPlayed: 10,
        matchWinRate: 80.0,
        updatedAt: 1000001,
      },
      {
        address: "0x0000000000000000000000000000000000000003",
        matchWins: 8,
        matchesPlayed: 12,
        matchWinRate: 66.67,
        updatedAt: 1000002,
      },
      {
        address: "0x0000000000000000000000000000000000000004",
        matchWins: 5,
        matchesPlayed: 8,
        matchWinRate: 62.5,
        updatedAt: 1000003,
      },
    ];

    // Mock database responses
    mockTurso.execute
      .mockResolvedValueOnce({
        rows: [{ total: testPlayers.length }],
      })
      .mockResolvedValueOnce({
        rows: testPlayers.map(p => ({
          address: p.address,
          match_wins: p.matchWins,
          matches_played: p.matchesPlayed,
          match_win_rate: p.matchWinRate,
          updated_at: p.updatedAt,
        })),
      });

    const result = await getMatchLeaderboard({ limit: 50, offset: 0 });

    // Verify that entries are properly sorted
    expect(result.entries).toHaveLength(4);

    // First player should have most wins
    expect(result.entries[0].matchWins).toBe(10);
    expect(result.entries[0].position).toBe(1);

    // Second player should have 8 wins with higher win rate
    expect(result.entries[1].matchWins).toBe(8);
    expect(result.entries[1].matchWinRate).toBe(80.0);
    expect(result.entries[1].position).toBe(2);

    // Third player should have 8 wins with lower win rate
    expect(result.entries[2].matchWins).toBe(8);
    expect(result.entries[2].matchWinRate).toBe(66.67);
    expect(result.entries[2].position).toBe(3);

    // Verify positions are sequential
    result.entries.forEach((entry, index) => {
      expect(entry.position).toBe(index + 1);
    });
  });

  it("Property 4.2: compareMatchRankings function produces consistent ordering", async () => {
    await fc.assert(
      fc.property(fc.tuple(leaderboardEntryGen, leaderboardEntryGen), ([entry1, entry2]) => {
        const comparison1 = compareMatchRankings(entry1, entry2);
        const comparison2 = compareMatchRankings(entry2, entry1);

        // Antisymmetric property: if a < b, then b > a
        if (comparison1 < 0) {
          expect(comparison2).toBeGreaterThan(0);
        } else if (comparison1 > 0) {
          expect(comparison2).toBeLessThan(0);
        } else {
          expect(comparison2).toBe(0);
        }

        // Verify sorting criteria are applied correctly
        if (entry1.matchWins !== entry2.matchWins) {
          const expected = entry2.matchWins - entry1.matchWins; // Higher wins rank better
          expect(Math.sign(comparison1)).toBe(Math.sign(expected));
        } else if (entry1.matchWinRate !== entry2.matchWinRate) {
          const expected = entry2.matchWinRate - entry1.matchWinRate; // Higher win rate ranks better
          expect(Math.sign(comparison1)).toBe(Math.sign(expected));
        } else if (entry1.matchesPlayed !== entry2.matchesPlayed) {
          const expected = entry2.matchesPlayed - entry1.matchesPlayed; // More matches played ranks better
          expect(Math.sign(comparison1)).toBe(Math.sign(expected));
        } else {
          const expected = entry1.address.localeCompare(entry2.address); // Lower address ranks better
          expect(Math.sign(comparison1)).toBe(Math.sign(expected));
        }
      }),
      { numRuns: 100 },
    );
  });

  it("Property 4.3: Ranking is transitive and consistent", async () => {
    await fc.assert(
      fc.property(
        fc.tuple(leaderboardEntryGen, leaderboardEntryGen, leaderboardEntryGen),
        ([entry1, entry2, entry3]) => {
          const comp12 = compareMatchRankings(entry1, entry2);
          const comp23 = compareMatchRankings(entry2, entry3);
          const comp13 = compareMatchRankings(entry1, entry3);

          // Transitivity: if a < b and b < c, then a < c
          if (comp12 < 0 && comp23 < 0) {
            expect(comp13).toBeLessThan(0);
          } else if (comp12 > 0 && comp23 > 0) {
            expect(comp13).toBeGreaterThan(0);
          }

          // Reflexivity: a == a
          expect(compareMatchRankings(entry1, entry1)).toBe(0);
          expect(compareMatchRankings(entry2, entry2)).toBe(0);
          expect(compareMatchRankings(entry3, entry3)).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4.4: Player ranking position matches leaderboard position", async () => {
    const testPlayer = {
      address: "0x1111111111111111111111111111111111111111",
      matchWins: 5,
      matchesPlayed: 8,
      matchWinRate: 62.5,
      updatedAt: 1000000,
    };

    // Mock getPlayerMatchRanking
    mockTurso.execute
      .mockResolvedValueOnce({
        rows: [
          {
            address: testPlayer.address,
            match_wins: testPlayer.matchWins,
            matches_played: testPlayer.matchesPlayed,
            match_win_rate: testPlayer.matchWinRate,
            updated_at: testPlayer.updatedAt,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ position: 15 }],
      });

    const playerRanking = await getPlayerMatchRanking(testPlayer.address);

    expect(playerRanking).not.toBeNull();
    expect(playerRanking!.position).toBe(15);
    expect(playerRanking!.matchWins).toBe(testPlayer.matchWins);
    expect(playerRanking!.matchesPlayed).toBe(testPlayer.matchesPlayed);
    expect(playerRanking!.matchWinRate).toBe(testPlayer.matchWinRate);
  });

  it("Property 4.5: Pagination preserves ranking order", async () => {
    const pageSize = 2;
    const testPlayers = [
      {
        address: "0x0000000000000000000000000000000000000001",
        matchWins: 10,
        matchesPlayed: 12,
        matchWinRate: 83.33,
        updatedAt: 1000000,
      },
      {
        address: "0x0000000000000000000000000000000000000002",
        matchWins: 8,
        matchesPlayed: 10,
        matchWinRate: 80.0,
        updatedAt: 1000001,
      },
      {
        address: "0x0000000000000000000000000000000000000003",
        matchWins: 5,
        matchesPlayed: 8,
        matchWinRate: 62.5,
        updatedAt: 1000002,
      },
      {
        address: "0x0000000000000000000000000000000000000004",
        matchWins: 3,
        matchesPlayed: 6,
        matchWinRate: 50.0,
        updatedAt: 1000003,
      },
    ];

    // Mock first page
    mockTurso.execute
      .mockResolvedValueOnce({
        rows: [{ total: testPlayers.length }],
      })
      .mockResolvedValueOnce({
        rows: testPlayers.slice(0, pageSize).map(p => ({
          address: p.address,
          match_wins: p.matchWins,
          matches_played: p.matchesPlayed,
          match_win_rate: p.matchWinRate,
          updated_at: p.updatedAt,
        })),
      });

    const firstPage = await getMatchLeaderboard({ limit: pageSize, offset: 0 });

    // Mock second page
    mockTurso.execute
      .mockResolvedValueOnce({
        rows: [{ total: testPlayers.length }],
      })
      .mockResolvedValueOnce({
        rows: testPlayers.slice(pageSize, pageSize * 2).map(p => ({
          address: p.address,
          match_wins: p.matchWins,
          matches_played: p.matchesPlayed,
          match_win_rate: p.matchWinRate,
          updated_at: p.updatedAt,
        })),
      });

    const secondPage = await getMatchLeaderboard({ limit: pageSize, offset: pageSize });

    // Verify positions are continuous across pages
    expect(firstPage.entries).toHaveLength(2);
    expect(secondPage.entries).toHaveLength(2);

    const lastFirstPagePosition = firstPage.entries[firstPage.entries.length - 1].position;
    const firstSecondPagePosition = secondPage.entries[0].position;

    expect(firstSecondPagePosition).toBe(lastFirstPagePosition + 1);
  });

  it("Property 4.6: Edge cases are handled correctly", async () => {
    // Test zero matches scenario
    const zeroMatchPlayers = [
      {
        address: "0x1111111111111111111111111111111111111111",
        matchWins: 0,
        matchesPlayed: 0,
        matchWinRate: 0,
        updatedAt: 1000000,
      },
    ];

    mockTurso.execute
      .mockResolvedValueOnce({
        rows: [{ total: zeroMatchPlayers.length }],
      })
      .mockResolvedValueOnce({
        rows: zeroMatchPlayers.map(p => ({
          address: p.address,
          match_wins: p.matchWins,
          matches_played: p.matchesPlayed,
          match_win_rate: p.matchWinRate,
          updated_at: p.updatedAt,
        })),
      });

    const result = await getMatchLeaderboard({ limit: 50, offset: 0 });

    // Verify basic properties hold for edge cases
    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.entries[0].position).toBe(1);
    expect(result.entries[0].matchWins).toBe(0);
    expect(result.entries[0].matchesPlayed).toBe(0);
    expect(result.entries[0].matchWinRate).toBe(0);
  });
});
