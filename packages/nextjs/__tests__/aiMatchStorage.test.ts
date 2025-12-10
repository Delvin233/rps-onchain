/**
 * AI Match Storage Tests
 *
 * Tests for Redis and Turso storage operations for AI matches.
 */
import {
  cleanupExpiredMatches,
  deleteActiveMatchFromRedis,
  getActiveMatchForPlayer,
  getActiveMatchFromRedis,
  getAllActiveMatches,
  saveActiveMatchToRedis,
} from "../lib/aiMatchStorage";
import { createNewMatch } from "../utils/aiMatchUtils";
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

describe("AI Match Storage", () => {
  const testPlayerId = "0x1234567890123456789012345678901234567890";
  let testMatch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    testMatch = createNewMatch(testPlayerId);

    // Mock successful Redis connection
    mockRedisClient.connect.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("saveActiveMatchToRedis", () => {
    it("should save match to Redis with correct key and TTL", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await saveActiveMatchToRedis(testMatch);

      // Verify match data was saved
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `ai_match:${testMatch.id}`,
        600, // REDIS_MATCH_TTL_SECONDS
        expect.stringContaining(testMatch.id),
      );

      // Verify player mapping was saved
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(`ai_match_player:${testPlayerId}`, 600, testMatch.id);
    });

    it("should serialize dates correctly", async () => {
      mockRedisClient.setEx.mockResolvedValue("OK");

      await saveActiveMatchToRedis(testMatch);

      const savedData = JSON.parse(mockRedisClient.setEx.mock.calls[0][2]);
      expect(savedData.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(savedData.lastActivityAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error("Redis connection failed"));

      await expect(saveActiveMatchToRedis(testMatch)).rejects.toThrow("Redis connection failed");
    });
  });

  describe("getActiveMatchFromRedis", () => {
    it("should retrieve and deserialize match correctly", async () => {
      const matchData = {
        ...testMatch,
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: testMatch.lastActivityAt.toISOString(),
        rounds: [],
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(matchData));

      const result = await getActiveMatchFromRedis(testMatch.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testMatch.id);
      expect(result!.playerId).toBe(testPlayerId);
      expect(result!.startedAt).toBeInstanceOf(Date);
      expect(result!.lastActivityAt).toBeInstanceOf(Date);
    });

    it("should return null for non-existent match", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await getActiveMatchFromRedis("non-existent-id");

      expect(result).toBeNull();
    });

    it("should deserialize rounds with timestamps correctly", async () => {
      const matchWithRounds = {
        ...testMatch,
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: testMatch.lastActivityAt.toISOString(),
        rounds: [
          {
            roundNumber: 1,
            playerMove: "rock",
            aiMove: "scissors",
            result: { winner: "player", playerMove: "rock", aiMove: "scissors" },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(matchWithRounds));

      const result = await getActiveMatchFromRedis(testMatch.id);

      expect(result!.rounds).toHaveLength(1);
      expect(result!.rounds[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe("deleteActiveMatchFromRedis", () => {
    it("should delete both match and player mapping", async () => {
      // Mock getting the match first
      const matchData = {
        ...testMatch,
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: testMatch.lastActivityAt.toISOString(),
        rounds: [],
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(matchData));
      mockRedisClient.del.mockResolvedValue(1);

      await deleteActiveMatchFromRedis(testMatch.id);

      expect(mockRedisClient.del).toHaveBeenCalledWith(`ai_match:${testMatch.id}`);
      expect(mockRedisClient.del).toHaveBeenCalledWith(`ai_match_player:${testPlayerId}`);
    });

    it("should handle deletion when match does not exist", async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.del.mockResolvedValue(0);

      await deleteActiveMatchFromRedis("non-existent-id");

      expect(mockRedisClient.del).toHaveBeenCalledWith("ai_match:non-existent-id");
      // Should not try to delete player mapping if match doesn't exist
      expect(mockRedisClient.del).toHaveBeenCalledTimes(1);
    });
  });

  describe("getActiveMatchForPlayer", () => {
    it("should retrieve match using player mapping", async () => {
      const matchData = {
        ...testMatch,
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: testMatch.lastActivityAt.toISOString(),
        rounds: [],
      };

      // Mock player mapping lookup
      mockRedisClient.get
        .mockResolvedValueOnce(testMatch.id) // Player mapping
        .mockResolvedValueOnce(JSON.stringify(matchData)); // Match data

      const result = await getActiveMatchForPlayer(testPlayerId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testMatch.id);
      expect(result!.playerId).toBe(testPlayerId);
    });

    it("should return null when player has no active match", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await getActiveMatchForPlayer(testPlayerId);

      expect(result).toBeNull();
    });
  });

  describe("getAllActiveMatches", () => {
    it("should retrieve all active matches", async () => {
      const match1Data = {
        ...testMatch,
        id: "match1",
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: testMatch.lastActivityAt.toISOString(),
        rounds: [],
      };

      const match2Data = {
        ...testMatch,
        id: "match2",
        playerId: "0x9876543210987654321098765432109876543210",
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: testMatch.lastActivityAt.toISOString(),
        rounds: [],
      };

      mockRedisClient.keys.mockResolvedValue([
        "ai_match:match1",
        "ai_match:match2",
        "ai_match_player:0x1234567890123456789012345678901234567890", // Should be filtered out
      ]);

      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(match1Data))
        .mockResolvedValueOnce(JSON.stringify(match2Data));

      const result = await getAllActiveMatches();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("match1");
      expect(result[1].id).toBe("match2");
    });

    it("should handle empty result set", async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await getAllActiveMatches();

      expect(result).toHaveLength(0);
    });
  });

  describe("cleanupExpiredMatches", () => {
    it("should clean up expired matches", async () => {
      const expiredMatch = {
        ...testMatch,
        id: "expired-match",
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
        rounds: [],
      };

      const activeMatch = {
        ...testMatch,
        id: "active-match",
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: new Date().toISOString(), // Now
        rounds: [],
      };

      // Mock getAllActiveMatches
      mockRedisClient.keys.mockResolvedValue(["ai_match:expired-match", "ai_match:active-match"]);
      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(expiredMatch))
        .mockResolvedValueOnce(JSON.stringify(activeMatch))
        .mockResolvedValueOnce(JSON.stringify(expiredMatch)); // For deletion

      mockRedisClient.del.mockResolvedValue(1);

      const cleanedCount = await cleanupExpiredMatches();

      expect(cleanedCount).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith("ai_match:expired-match");
    });

    it("should not clean up active matches", async () => {
      const activeMatch = {
        ...testMatch,
        startedAt: testMatch.startedAt.toISOString(),
        lastActivityAt: new Date().toISOString(),
        rounds: [],
      };

      mockRedisClient.keys.mockResolvedValue(["ai_match:active-match"]);
      mockRedisClient.get.mockResolvedValue(JSON.stringify(activeMatch));

      const cleanedCount = await cleanupExpiredMatches();

      expect(cleanedCount).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });
});
