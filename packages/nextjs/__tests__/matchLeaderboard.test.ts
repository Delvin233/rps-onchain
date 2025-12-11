/**
 * Unit Tests for Match-Based Leaderboard System
 *
 * Tests the implementation of task 4.4: Implement leaderboard ranking system
 * Requirements 3.5: Leaderboard ranking based on match victories
 */
import {
  type MatchLeaderboardEntry,
  compareMatchRankings,
  getLeaderboardAroundPlayer,
  getMatchLeaderboard,
  getPlayerMatchRanking,
  validateMatchLeaderboardEntry,
} from "../lib/match-leaderboard";
import { turso } from "../lib/turso";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the turso database
vi.mock("../lib/turso", () => ({
  turso: {
    execute: vi.fn(),
  },
}));

const mockTurso = turso as any;

describe("Match-Based Leaderboard System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMatchLeaderboard", () => {
    it("should return properly formatted leaderboard with correct sorting", async () => {
      // Mock database responses
      mockTurso.execute
        .mockResolvedValueOnce({
          rows: [{ total: 3 }], // Count query
        })
        .mockResolvedValueOnce({
          rows: [
            {
              address: "0x1111111111111111111111111111111111111111",
              match_wins: 10,
              matches_played: 12,
              match_win_rate: 83.33,
              updated_at: 1000000,
            },
            {
              address: "0x2222222222222222222222222222222222222222",
              match_wins: 8,
              matches_played: 10,
              match_win_rate: 80.0,
              updated_at: 1000001,
            },
            {
              address: "0x3333333333333333333333333333333333333333",
              match_wins: 5,
              matches_played: 8,
              match_win_rate: 62.5,
              updated_at: 1000002,
            },
          ],
        });

      const result = await getMatchLeaderboard({ limit: 10, offset: 0 });

      expect(result).toEqual({
        entries: [
          {
            address: "0x1111111111111111111111111111111111111111",
            matchWins: 10,
            matchesPlayed: 12,
            matchWinRate: 83.33,
            position: 1,
            displayName: null,
            updatedAt: 1000000,
          },
          {
            address: "0x2222222222222222222222222222222222222222",
            matchWins: 8,
            matchesPlayed: 10,
            matchWinRate: 80.0,
            position: 2,
            displayName: null,
            updatedAt: 1000001,
          },
          {
            address: "0x3333333333333333333333333333333333333333",
            matchWins: 5,
            matchesPlayed: 8,
            matchWinRate: 62.5,
            position: 3,
            displayName: null,
            updatedAt: 1000002,
          },
        ],
        total: 3,
        hasMore: false,
        limit: 10,
        offset: 0,
      });

      // Verify correct SQL queries were called
      expect(mockTurso.execute).toHaveBeenCalledTimes(2);

      // Check count query
      expect(mockTurso.execute).toHaveBeenNthCalledWith(1, {
        sql: expect.stringContaining("SELECT COUNT(*) as total"),
        args: [0], // minMatches = 0
      });

      // Check data query with proper sorting
      expect(mockTurso.execute).toHaveBeenNthCalledWith(2, {
        sql: expect.stringContaining("ORDER BY"),
        args: [0, 10, 0], // minMatches, limit, offset
      });
    });

    it("should validate parameters correctly", async () => {
      await expect(getMatchLeaderboard({ limit: 0 })).rejects.toThrow("Limit must be between 1 and 100");
      await expect(getMatchLeaderboard({ limit: 101 })).rejects.toThrow("Limit must be between 1 and 100");
      await expect(getMatchLeaderboard({ offset: -1 })).rejects.toThrow("Offset must be non-negative");
      await expect(getMatchLeaderboard({ minMatches: -1 })).rejects.toThrow("Minimum matches must be non-negative");
    });
  });

  describe("getPlayerMatchRanking", () => {
    it("should return player ranking with correct position calculation", async () => {
      const playerAddress = "0x1111111111111111111111111111111111111111";

      // Mock player stats query
      mockTurso.execute
        .mockResolvedValueOnce({
          rows: [
            {
              address: playerAddress.toLowerCase(),
              match_wins: 5,
              matches_played: 8,
              match_win_rate: 62.5,
              updated_at: 1000000,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ position: 15 }], // Position query
        });

      const result = await getPlayerMatchRanking(playerAddress);

      expect(result).toEqual({
        address: playerAddress.toLowerCase(),
        matchWins: 5,
        matchesPlayed: 8,
        matchWinRate: 62.5,
        position: 15,
        displayName: null,
        updatedAt: 1000000,
      });

      expect(mockTurso.execute).toHaveBeenCalledTimes(2);
    });

    it("should return null for non-existent player", async () => {
      mockTurso.execute.mockResolvedValueOnce({
        rows: [],
      });

      const result = await getPlayerMatchRanking("0x9999999999999999999999999999999999999999");
      expect(result).toBeNull();
    });
  });

  describe("compareMatchRankings", () => {
    it("should sort by match wins first", () => {
      const player1: MatchLeaderboardEntry = {
        address: "0x1111",
        matchWins: 10,
        matchesPlayed: 12,
        matchWinRate: 83.33,
        position: 1,
        updatedAt: 1000000,
      };

      const player2: MatchLeaderboardEntry = {
        address: "0x2222",
        matchWins: 8,
        matchesPlayed: 10,
        matchWinRate: 80.0,
        position: 2,
        updatedAt: 1000001,
      };

      expect(compareMatchRankings(player1, player2)).toBeLessThan(0); // player1 ranks higher
      expect(compareMatchRankings(player2, player1)).toBeGreaterThan(0); // player2 ranks lower
    });

    it("should use win rate as tie-breaker", () => {
      const player1: MatchLeaderboardEntry = {
        address: "0x1111",
        matchWins: 5,
        matchesPlayed: 6,
        matchWinRate: 83.33,
        position: 1,
        updatedAt: 1000000,
      };

      const player2: MatchLeaderboardEntry = {
        address: "0x2222",
        matchWins: 5,
        matchesPlayed: 8,
        matchWinRate: 62.5,
        position: 2,
        updatedAt: 1000001,
      };

      expect(compareMatchRankings(player1, player2)).toBeLessThan(0); // player1 ranks higher (better win rate)
    });

    it("should use matches played as secondary tie-breaker", () => {
      const player1: MatchLeaderboardEntry = {
        address: "0x1111",
        matchWins: 5,
        matchesPlayed: 10,
        matchWinRate: 50.0,
        position: 1,
        updatedAt: 1000000,
      };

      const player2: MatchLeaderboardEntry = {
        address: "0x2222",
        matchWins: 5,
        matchesPlayed: 8,
        matchWinRate: 50.0,
        position: 2,
        updatedAt: 1000001,
      };

      expect(compareMatchRankings(player1, player2)).toBeLessThan(0); // player1 ranks higher (more matches played)
    });

    it("should use address as final tie-breaker", () => {
      const player1: MatchLeaderboardEntry = {
        address: "0x1111",
        matchWins: 5,
        matchesPlayed: 10,
        matchWinRate: 50.0,
        position: 1,
        updatedAt: 1000000,
      };

      const player2: MatchLeaderboardEntry = {
        address: "0x2222",
        matchWins: 5,
        matchesPlayed: 10,
        matchWinRate: 50.0,
        position: 2,
        updatedAt: 1000001,
      };

      expect(compareMatchRankings(player1, player2)).toBeLessThan(0); // player1 ranks higher (lower address)
    });
  });

  describe("validateMatchLeaderboardEntry", () => {
    it("should validate correct entry", () => {
      const validEntry: MatchLeaderboardEntry = {
        address: "0x1111111111111111111111111111111111111111",
        matchWins: 5,
        matchesPlayed: 10,
        matchWinRate: 50.0,
        position: 1,
        updatedAt: 1000000,
      };

      expect(() => validateMatchLeaderboardEntry(validEntry)).not.toThrow();
    });

    it("should reject invalid entries", () => {
      const invalidEntries = [
        { ...{}, address: "", matchWins: 5, matchesPlayed: 10, matchWinRate: 50.0, position: 1, updatedAt: 1000000 },
        {
          ...{},
          address: "0x1111",
          matchWins: -1,
          matchesPlayed: 10,
          matchWinRate: 50.0,
          position: 1,
          updatedAt: 1000000,
        },
        {
          ...{},
          address: "0x1111",
          matchWins: 5,
          matchesPlayed: -1,
          matchWinRate: 50.0,
          position: 1,
          updatedAt: 1000000,
        },
        {
          ...{},
          address: "0x1111",
          matchWins: 15,
          matchesPlayed: 10,
          matchWinRate: 50.0,
          position: 1,
          updatedAt: 1000000,
        }, // wins > played
        {
          ...{},
          address: "0x1111",
          matchWins: 5,
          matchesPlayed: 10,
          matchWinRate: 150.0,
          position: 1,
          updatedAt: 1000000,
        }, // invalid win rate
        {
          ...{},
          address: "0x1111",
          matchWins: 5,
          matchesPlayed: 10,
          matchWinRate: 50.0,
          position: 0,
          updatedAt: 1000000,
        }, // invalid position
      ];

      invalidEntries.forEach(entry => {
        expect(() => validateMatchLeaderboardEntry(entry as MatchLeaderboardEntry)).toThrow();
      });
    });
  });

  describe("getLeaderboardAroundPlayer", () => {
    it("should return empty array for non-existent player", async () => {
      mockTurso.execute.mockResolvedValueOnce({
        rows: [],
      });

      const result = await getLeaderboardAroundPlayer("0x9999999999999999999999999999999999999999");
      expect(result).toEqual([]);
    });
  });
});
