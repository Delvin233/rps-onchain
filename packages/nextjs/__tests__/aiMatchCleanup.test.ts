/**
 * AI Match Cleanup Tests
 *
 * Tests for match abandonment patterns, cleanup logic, and scheduled maintenance.
 */
import { getCleanupRecommendation, performEmergencyCleanup, performScheduledCleanup } from "../lib/aiMatchCleanup";
import { aiMatchManager } from "../lib/aiMatchManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the storage functions
vi.mock("../lib/aiMatchStorage", () => ({
  getPlayerMatchStats: vi.fn(),
  cleanupExpiredMatches: vi.fn(),
  deleteOldAbandonedMatches: vi.fn(),
  getAllActiveMatches: vi.fn(),
  getActiveMatchForPlayer: vi.fn(),
  saveActiveMatchToRedis: vi.fn(),
  completeMatch: vi.fn(),
}));

// Mock the utility functions
vi.mock("../utils/aiMatchUtils", () => ({
  generateAIMove: vi.fn(() => "rock"),
}));

describe("AI Match Cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Abandonment Pattern Detection", () => {
    it("should allow new matches for players with low abandonment rates", async () => {
      const { getPlayerMatchStats } = await import("../lib/aiMatchStorage");
      vi.mocked(getPlayerMatchStats).mockResolvedValue({
        ai_matches_played: 10,
        ai_matches_won: 5,
        ai_matches_lost: 4,
        ai_matches_tied: 1,
        ai_matches_abandoned: 2, // 20% abandonment rate
      });

      const hasExcessivePattern = await aiMatchManager.hasExcessiveAbandonmentPattern("0x123");
      expect(hasExcessivePattern).toBe(false);
    });

    it("should restrict players with high abandonment rates", async () => {
      const { getPlayerMatchStats } = await import("../lib/aiMatchStorage");
      vi.mocked(getPlayerMatchStats).mockResolvedValue({
        ai_matches_played: 5,
        ai_matches_won: 2,
        ai_matches_lost: 1,
        ai_matches_tied: 0,
        ai_matches_abandoned: 5, // 50% abandonment rate with 5 abandonments
      });

      const hasExcessivePattern = await aiMatchManager.hasExcessiveAbandonmentPattern("0x123");
      expect(hasExcessivePattern).toBe(true);
    });

    it("should not restrict new players with few matches", async () => {
      const { getPlayerMatchStats } = await import("../lib/aiMatchStorage");
      vi.mocked(getPlayerMatchStats).mockResolvedValue({
        ai_matches_played: 2,
        ai_matches_won: 1,
        ai_matches_lost: 0,
        ai_matches_tied: 0,
        ai_matches_abandoned: 2, // High rate but low total
      });

      const hasExcessivePattern = await aiMatchManager.hasExcessiveAbandonmentPattern("0x123");
      expect(hasExcessivePattern).toBe(false);
    });

    it("should handle errors gracefully when checking patterns", async () => {
      const { getPlayerMatchStats } = await import("../lib/aiMatchStorage");
      vi.mocked(getPlayerMatchStats).mockRejectedValue(new Error("Database error"));

      const hasExcessivePattern = await aiMatchManager.hasExcessiveAbandonmentPattern("0x123");
      expect(hasExcessivePattern).toBe(false); // Default to allowing matches
    });
  });

  describe("Match Cleanup Operations", () => {
    it("should perform comprehensive cleanup", async () => {
      const { cleanupExpiredMatches, deleteOldAbandonedMatches } = await import("../lib/aiMatchStorage");
      vi.mocked(cleanupExpiredMatches).mockResolvedValue(5);
      vi.mocked(deleteOldAbandonedMatches).mockResolvedValue(3);

      const results = await aiMatchManager.performMatchCleanup({
        deleteAbandonedOlderThanDays: 7,
        cleanupExpiredActive: true,
      });

      expect(results.expiredActiveMatches).toBe(5);
      expect(results.deletedAbandonedMatches).toBe(3);
      expect(cleanupExpiredMatches).toHaveBeenCalledTimes(1);
      expect(deleteOldAbandonedMatches).toHaveBeenCalledWith(7);
    });

    it("should skip active cleanup when disabled", async () => {
      const { cleanupExpiredMatches, deleteOldAbandonedMatches } = await import("../lib/aiMatchStorage");
      vi.mocked(deleteOldAbandonedMatches).mockResolvedValue(2);

      const results = await aiMatchManager.performMatchCleanup({
        cleanupExpiredActive: false,
      });

      expect(results.expiredActiveMatches).toBe(0);
      expect(results.deletedAbandonedMatches).toBe(2);
      expect(cleanupExpiredMatches).not.toHaveBeenCalled();
      expect(deleteOldAbandonedMatches).toHaveBeenCalledWith(7); // Default value
    });

    it("should use custom deletion threshold", async () => {
      const { deleteOldAbandonedMatches } = await import("../lib/aiMatchStorage");
      vi.mocked(deleteOldAbandonedMatches).mockResolvedValue(1);

      await aiMatchManager.performMatchCleanup({
        deleteAbandonedOlderThanDays: 14,
      });

      expect(deleteOldAbandonedMatches).toHaveBeenCalledWith(14);
    });
  });

  describe("Abandonment Metrics", () => {
    it("should calculate metrics correctly", async () => {
      const { getAllActiveMatches } = await import("../lib/aiMatchStorage");
      const now = new Date();
      const recentMatch = {
        id: "recent",
        lastActivityAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      };
      const oldMatch = {
        id: "old",
        lastActivityAt: new Date(now.getTime() - 9 * 60 * 1000), // 9 minutes ago (near timeout)
      };

      vi.mocked(getAllActiveMatches).mockResolvedValue([recentMatch, oldMatch] as any);

      const metrics = await aiMatchManager.getAbandonmentMetrics();

      expect(metrics.totalActiveMatches).toBe(2);
      expect(metrics.recentAbandonments).toBe(1); // Only oldMatch is near timeout
      expect(metrics.cleanupRecommended).toBe(false); // Not enough near-timeout matches
    });

    it("should recommend cleanup for many near-timeout matches", async () => {
      const { getAllActiveMatches } = await import("../lib/aiMatchStorage");
      const now = new Date();
      const nearTimeoutMatches = Array.from({ length: 15 }, (_, i) => ({
        id: `match-${i}`,
        lastActivityAt: new Date(now.getTime() - 9 * 60 * 1000), // 9 minutes ago
      }));

      vi.mocked(getAllActiveMatches).mockResolvedValue(nearTimeoutMatches as any);

      const metrics = await aiMatchManager.getAbandonmentMetrics();

      expect(metrics.totalActiveMatches).toBe(15);
      expect(metrics.recentAbandonments).toBe(15);
      expect(metrics.cleanupRecommended).toBe(true); // More than 10 near timeout
    });
  });

  describe("Scheduled Cleanup", () => {
    it("should perform scheduled cleanup successfully", async () => {
      const { cleanupExpiredMatches, deleteOldAbandonedMatches, getAllActiveMatches } = await import(
        "../lib/aiMatchStorage"
      );
      vi.mocked(cleanupExpiredMatches).mockResolvedValue(3);
      vi.mocked(deleteOldAbandonedMatches).mockResolvedValue(2);
      vi.mocked(getAllActiveMatches).mockResolvedValue([]);

      const result = await performScheduledCleanup({
        deleteAbandonedOlderThanDays: 5,
        logResults: false,
      });

      expect(result.success).toBe(true);
      expect(result.results?.expiredActiveMatches).toBe(3);
      expect(result.results?.deletedAbandonedMatches).toBe(2);
      expect(result.metrics?.totalActiveMatches).toBe(0);
    });

    it("should handle cleanup errors gracefully", async () => {
      const { cleanupExpiredMatches } = await import("../lib/aiMatchStorage");
      vi.mocked(cleanupExpiredMatches).mockRejectedValue(new Error("Redis error"));

      const result = await performScheduledCleanup();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Redis error");
    });
  });

  describe("Cleanup Recommendations", () => {
    it("should recommend cleanup for high active match count", async () => {
      const { getAllActiveMatches } = await import("../lib/aiMatchStorage");
      const manyMatches = Array.from({ length: 150 }, (_, i) => ({
        id: `match-${i}`,
        lastActivityAt: new Date(),
      }));
      vi.mocked(getAllActiveMatches).mockResolvedValue(manyMatches as any);

      const recommendation = await getCleanupRecommendation();

      expect(recommendation.recommended).toBe(true);
      expect(recommendation.reason).toContain("High number of active matches");
      expect(recommendation.metrics.totalActiveMatches).toBe(150);
    });

    it("should not recommend cleanup for normal conditions", async () => {
      const { getAllActiveMatches } = await import("../lib/aiMatchStorage");
      const normalMatches = Array.from({ length: 10 }, (_, i) => ({
        id: `match-${i}`,
        lastActivityAt: new Date(),
      }));
      vi.mocked(getAllActiveMatches).mockResolvedValue(normalMatches as any);

      const recommendation = await getCleanupRecommendation();

      expect(recommendation.recommended).toBe(false);
      expect(recommendation.reason).toBeUndefined();
    });
  });

  describe("Emergency Cleanup", () => {
    it("should perform aggressive cleanup", async () => {
      const { cleanupExpiredMatches, deleteOldAbandonedMatches } = await import("../lib/aiMatchStorage");
      vi.mocked(cleanupExpiredMatches).mockResolvedValue(10);
      vi.mocked(deleteOldAbandonedMatches).mockResolvedValue(25);

      const result = await performEmergencyCleanup();

      expect(result.success).toBe(true);
      expect(result.results?.expiredActiveMatches).toBe(10);
      expect(result.results?.deletedAbandonedMatches).toBe(25);
      expect(deleteOldAbandonedMatches).toHaveBeenCalledWith(1); // 1 day threshold
    });

    it("should handle emergency cleanup errors", async () => {
      const { cleanupExpiredMatches } = await import("../lib/aiMatchStorage");
      vi.mocked(cleanupExpiredMatches).mockRejectedValue(new Error("System overload"));

      const result = await performEmergencyCleanup();

      expect(result.success).toBe(false);
      expect(result.error).toBe("System overload");
    });
  });
});
