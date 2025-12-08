import { RANK_TIERS, getNextRank, getRankColor, getRankForWins, getRankTier, hasGradient } from "../ranks";
import { describe, expect, it } from "vitest";

describe("Rank System", () => {
  describe("getRankForWins", () => {
    it("should return Beginner for 0-4 wins", () => {
      expect(getRankForWins(0).name).toBe("Beginner");
      expect(getRankForWins(4).name).toBe("Beginner");
    });

    it("should return Novice for 5-9 wins", () => {
      expect(getRankForWins(5).name).toBe("Novice");
      expect(getRankForWins(9).name).toBe("Novice");
    });

    it("should return Fighter for 10-19 wins", () => {
      expect(getRankForWins(10).name).toBe("Fighter");
      expect(getRankForWins(19).name).toBe("Fighter");
    });

    it("should return Warrior I for 20-29 wins", () => {
      expect(getRankForWins(20).name).toBe("Warrior I");
      expect(getRankForWins(29).name).toBe("Warrior I");
    });

    it("should return Legend V for 210-219 wins", () => {
      expect(getRankForWins(210).name).toBe("Legend V");
      expect(getRankForWins(219).name).toBe("Legend V");
    });

    it("should return Mythic I for 220-239 wins", () => {
      expect(getRankForWins(220).name).toBe("Mythic I");
      expect(getRankForWins(239).name).toBe("Mythic I");
    });

    it("should return RPS-God I for 320-369 wins", () => {
      expect(getRankForWins(320).name).toBe("RPS-God I");
      expect(getRankForWins(369).name).toBe("RPS-God I");
    });

    it("should return RPS-God X for 690+ wins", () => {
      expect(getRankForWins(690).name).toBe("RPS-God X");
      expect(getRankForWins(1000).name).toBe("RPS-God X");
    });
  });

  describe("getNextRank", () => {
    it("should return next rank and wins needed", () => {
      const result = getNextRank(0);
      expect(result).not.toBeNull();
      expect(result?.rank.name).toBe("Novice");
      expect(result?.winsNeeded).toBe(5);
    });

    it("should return correct wins needed for mid-tier", () => {
      const result = getNextRank(25);
      expect(result?.rank.name).toBe("Warrior II");
      expect(result?.winsNeeded).toBe(5);
    });

    it("should return null for max rank", () => {
      const result = getNextRank(690);
      expect(result).toBeNull();
    });
  });

  describe("getRankColor", () => {
    it("should return color for basic ranks", () => {
      expect(getRankColor("Beginner")).toBe("#9CA3AF");
      expect(getRankColor("Fighter")).toBe("#60A5FA");
    });

    it("should return gradient for Mythic ranks", () => {
      const color = getRankColor("Mythic I");
      expect(color).toContain("linear-gradient");
    });

    it("should return gradient for RPS-God ranks", () => {
      const color = getRankColor("RPS-God X");
      expect(color).toContain("linear-gradient");
    });
  });

  describe("hasGradient", () => {
    it("should return false for basic ranks", () => {
      expect(hasGradient("Beginner")).toBe(false);
      expect(hasGradient("Warrior I")).toBe(false);
    });

    it("should return true for Mythic ranks", () => {
      expect(hasGradient("Mythic I")).toBe(true);
      expect(hasGradient("Mythic V")).toBe(true);
    });

    it("should return true for RPS-God ranks", () => {
      expect(hasGradient("RPS-God I")).toBe(true);
      expect(hasGradient("RPS-God X")).toBe(true);
    });
  });

  describe("getRankTier", () => {
    it("should return correct tier for entry ranks", () => {
      expect(getRankTier("Beginner")).toBe("Entry");
      expect(getRankTier("Novice")).toBe("Entry");
      expect(getRankTier("Fighter")).toBe("Entry");
    });

    it("should return correct tier for warrior ranks", () => {
      expect(getRankTier("Warrior I")).toBe("Warrior");
      expect(getRankTier("Warrior III")).toBe("Warrior");
    });

    it("should return correct tier for RPS-God ranks", () => {
      expect(getRankTier("RPS-God I")).toBe("RPS-God");
      expect(getRankTier("RPS-God X")).toBe("RPS-God");
    });
  });

  describe("RANK_TIERS", () => {
    it("should have 38 ranks total", () => {
      expect(RANK_TIERS.length).toBe(38);
    });

    it("should have no gaps in win ranges", () => {
      for (let i = 0; i < RANK_TIERS.length - 1; i++) {
        const current = RANK_TIERS[i];
        const next = RANK_TIERS[i + 1];
        expect(current.maxWins! + 1).toBe(next.minWins);
      }
    });

    it("should have RPS-God X as final rank with no max", () => {
      const lastRank = RANK_TIERS[RANK_TIERS.length - 1];
      expect(lastRank.name).toBe("RPS-God X");
      expect(lastRank.maxWins).toBeNull();
    });
  });
});
