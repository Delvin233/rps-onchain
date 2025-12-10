/**
 * AI Match Manager Unit Tests
 *
 * Tests for the core AIMatchManager functionality including match lifecycle,
 * state management, and business logic validation.
 */
import { AIMatchManager } from "../lib/aiMatchManager";
import * as aiMatchStorage from "../lib/aiMatchStorage";
import { MatchStatus } from "../types/aiMatch";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the storage functions
vi.mock("../lib/aiMatchStorage", () => ({
  saveActiveMatchToRedis: vi.fn(),
  getActiveMatchFromRedis: vi.fn(),
  deleteActiveMatchFromRedis: vi.fn(),
  completeMatch: vi.fn(),
}));

describe("AIMatchManager", () => {
  let manager: AIMatchManager;
  const testPlayerId = "0x1234567890123456789012345678901234567890";

  beforeEach(() => {
    manager = new AIMatchManager();
    vi.clearAllMocks();
  });

  describe("startMatch", () => {
    it("should create a new match for a player", async () => {
      // Mock no existing active match
      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);
      vi.mocked(aiMatchStorage.saveActiveMatchToRedis).mockResolvedValue();

      const match = await manager.startMatch(testPlayerId);

      expect(match.playerId).toBe(testPlayerId);
      expect(match.status).toBe(MatchStatus.ACTIVE);
      expect(match.playerScore).toBe(0);
      expect(match.aiScore).toBe(0);
      expect(match.currentRound).toBe(1);
      expect(match.rounds).toHaveLength(0);
      expect(match.isAbandoned).toBe(false);
      expect(match.id).toMatch(/^match_/);

      expect(aiMatchStorage.saveActiveMatchToRedis).toHaveBeenCalledWith(match);
    });

    it("should generate unique match IDs", async () => {
      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);
      vi.mocked(aiMatchStorage.saveActiveMatchToRedis).mockResolvedValue();

      const match1 = await manager.startMatch(testPlayerId);
      const match2 = await manager.startMatch(`${testPlayerId}2`);

      expect(match1.id).not.toBe(match2.id);
      expect(match1.id).toMatch(/^match_/);
      expect(match2.id).toMatch(/^match_/);
    });
  });

  describe("playRound", () => {
    it("should play a round and update match state", async () => {
      // Create a mock active match
      const mockMatch = {
        id: "test-match-id",
        playerId: testPlayerId,
        status: MatchStatus.ACTIVE,
        playerScore: 0,
        aiScore: 0,
        currentRound: 1,
        rounds: [],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isAbandoned: false,
      };

      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(mockMatch);
      vi.mocked(aiMatchStorage.saveActiveMatchToRedis).mockResolvedValue();

      const result = await manager.playRound("test-match-id", "rock");

      expect(result.match.rounds).toHaveLength(1);
      expect(result.match.currentRound).toBe(2);
      expect(result.roundResult.playerMove).toBe("rock");
      expect(["rock", "paper", "scissors"]).toContain(result.roundResult.aiMove);
      expect(["player", "ai", "tie"]).toContain(result.roundResult.winner);

      // Verify the round was recorded correctly
      const round = result.match.rounds[0];
      expect(round.roundNumber).toBe(1);
      expect(round.playerMove).toBe("rock");
      expect(round.result).toEqual(result.roundResult);
      expect(round.timestamp).toBeInstanceOf(Date);
    });

    it("should complete match when player reaches 2 wins", async () => {
      // Create a match where player has 1 win and will get another
      const mockMatch = {
        id: "test-match-id",
        playerId: testPlayerId,
        status: MatchStatus.ACTIVE,
        playerScore: 1,
        aiScore: 0,
        currentRound: 2,
        rounds: [
          {
            roundNumber: 1,
            playerMove: "rock" as const,
            aiMove: "scissors" as const,
            result: { winner: "player" as const, playerMove: "rock" as const, aiMove: "scissors" as const },
            timestamp: new Date(),
          },
        ],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isAbandoned: false,
      };

      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(mockMatch);
      vi.mocked(aiMatchStorage.completeMatch).mockResolvedValue();

      // Mock AI to play scissors so player wins with rock
      const originalRandom = Math.random;
      Math.random = () => 0.9; // This should make AI choose scissors

      const result = await manager.playRound("test-match-id", "rock");

      // Restore original Math.random
      Math.random = originalRandom;

      expect(result.match.status).toBe(MatchStatus.COMPLETED);
      expect(result.match.winner).toBe("player");
      expect(result.match.playerScore).toBe(2);
      expect(result.match.completedAt).toBeInstanceOf(Date);

      expect(aiMatchStorage.completeMatch).toHaveBeenCalledWith(result.match);
    });

    it("should throw error for non-existent match", async () => {
      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);

      await expect(manager.playRound("non-existent", "rock")).rejects.toThrow("Match not found: non-existent");
    });

    it("should throw error for completed match", async () => {
      const completedMatch = {
        id: "completed-match",
        playerId: testPlayerId,
        status: MatchStatus.COMPLETED,
        playerScore: 2,
        aiScore: 1,
        currentRound: 4,
        rounds: [],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        completedAt: new Date(),
        winner: "player" as const,
        isAbandoned: false,
      };

      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(completedMatch);

      await expect(manager.playRound("completed-match", "rock")).rejects.toThrow(
        "Match already completed: completed-match",
      );
    });
  });

  describe("getMatchStatus", () => {
    it("should return active match from Redis", async () => {
      const mockMatch = {
        id: "test-match",
        playerId: testPlayerId,
        status: MatchStatus.ACTIVE,
        playerScore: 0,
        aiScore: 1,
        currentRound: 2,
        rounds: [],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isAbandoned: false,
      };

      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(mockMatch);

      const result = await manager.getMatchStatus("test-match");

      expect(result).toEqual(mockMatch);
    });

    it("should return null for non-existent match", async () => {
      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);

      const result = await manager.getMatchStatus("non-existent");

      expect(result).toBeNull();
    });

    it("should abandon timed out match", async () => {
      const timedOutMatch = {
        id: "timed-out-match",
        playerId: testPlayerId,
        status: MatchStatus.ACTIVE,
        playerScore: 0,
        aiScore: 0,
        currentRound: 1,
        rounds: [],
        startedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        lastActivityAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago (past timeout)
        isAbandoned: false,
      };

      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(timedOutMatch);
      vi.mocked(aiMatchStorage.completeMatch).mockResolvedValue();

      const result = await manager.getMatchStatus("timed-out-match");

      expect(result?.status).toBe(MatchStatus.ABANDONED);
      expect(result?.isAbandoned).toBe(true);
      expect(result?.winner).toBe("ai");
      expect(aiMatchStorage.completeMatch).toHaveBeenCalled();
    });
  });

  describe("abandonMatchById", () => {
    it("should abandon an active match", async () => {
      const activeMatch = {
        id: "active-match",
        playerId: testPlayerId,
        status: MatchStatus.ACTIVE,
        playerScore: 1,
        aiScore: 0,
        currentRound: 2,
        rounds: [],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isAbandoned: false,
      };

      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(activeMatch);
      vi.mocked(aiMatchStorage.completeMatch).mockResolvedValue();

      const result = await manager.abandonMatchById("active-match");

      expect(result.status).toBe(MatchStatus.ABANDONED);
      expect(result.isAbandoned).toBe(true);
      expect(result.winner).toBe("ai");
      expect(result.completedAt).toBeInstanceOf(Date);

      expect(aiMatchStorage.completeMatch).toHaveBeenCalledWith(result);
    });

    it("should throw error for non-existent match", async () => {
      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(null);

      await expect(manager.abandonMatchById("non-existent")).rejects.toThrow("Match not found: non-existent");
    });

    it("should throw error for already completed match", async () => {
      const completedMatch = {
        id: "completed-match",
        playerId: testPlayerId,
        status: MatchStatus.COMPLETED,
        playerScore: 2,
        aiScore: 0,
        currentRound: 3,
        rounds: [],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        completedAt: new Date(),
        winner: "player" as const,
        isAbandoned: false,
      };

      vi.mocked(aiMatchStorage.getActiveMatchFromRedis).mockResolvedValue(completedMatch);

      await expect(manager.abandonMatchById("completed-match")).rejects.toThrow(
        "Cannot abandon match completed-match - not active",
      );
    });
  });
});
