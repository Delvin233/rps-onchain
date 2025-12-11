import { clearCache, getCacheStats, resolveDisplayName } from "../nameResolver";
import { beforeEach, describe, expect, it } from "vitest";

describe("Name Resolver", () => {
  beforeEach(() => {
    clearCache();
  });

  describe("resolveDisplayName", () => {
    it("should return truncated address as fallback", async () => {
      const address = "0x1234567890123456789012345678901234567890";
      const result = await resolveDisplayName(address);

      // Should return truncated format
      expect(result).toMatch(/^0x[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/);
      expect(result).toBe("0x1234...7890");
    });

    it("should handle lowercase addresses", async () => {
      const address = "0xABCDEF1234567890123456789012345678901234";
      const result = await resolveDisplayName(address);

      expect(result).toBe("0xabcd...1234");
    }, 10000); // Increase timeout for RPC calls

    it("should cache resolved names", async () => {
      clearCache(); // Ensure clean state
      const address = "0x9999999999999999999999999999999999999999";

      // First call
      await resolveDisplayName(address);

      // Check cache
      const stats = getCacheStats();
      expect(stats.size).toBeGreaterThanOrEqual(1);
    }, 10000);

    it("should return cached result on second call", async () => {
      const address = "0x8888888888888888888888888888888888888888";

      const result1 = await resolveDisplayName(address);
      const result2 = await resolveDisplayName(address);

      expect(result1).toBe(result2);
    }, 10000);
  });

  describe("clearCache", () => {
    it("should clear all cached entries", async () => {
      clearCache(); // Start fresh
      const address1 = "0x7777777777777777777777777777777777777777";
      const address2 = "0x6666666666666666666666666666666666666666";

      await resolveDisplayName(address1);
      await resolveDisplayName(address2);

      expect(getCacheStats().size).toBeGreaterThanOrEqual(2);

      clearCache();

      expect(getCacheStats().size).toBe(0);
    }, 15000);
  });

  describe("getCacheStats", () => {
    it("should return correct cache size", async () => {
      clearCache();
      expect(getCacheStats().size).toBe(0);

      await resolveDisplayName("0x5555555555555555555555555555555555555555");
      expect(getCacheStats().size).toBeGreaterThanOrEqual(1);

      await resolveDisplayName("0x4444444444444444444444444444444444444444");
      expect(getCacheStats().size).toBeGreaterThanOrEqual(2);
    }, 15000);

    it("should track oldest entry age", async () => {
      clearCache();
      await resolveDisplayName("0x3333333333333333333333333333333333333333");

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = getCacheStats();
      expect(stats.oldestEntryAge).toBeGreaterThan(0);
    }, 10000);
  });
});
