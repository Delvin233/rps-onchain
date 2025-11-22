import { retryWithBackoff, withFallback } from "../../utils/errorRecovery";
import { describe, expect, it, vi } from "vitest";

describe("errorRecovery", () => {
  describe("retryWithBackoff", () => {
    it("succeeds on first try", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await retryWithBackoff(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on failure", async () => {
      const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("success");

      const result = await retryWithBackoff(fn, { maxRetries: 3 });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("withFallback", () => {
    it("returns primary result on success", async () => {
      const primary = vi.fn().mockResolvedValue("primary");
      const fallback = vi.fn().mockResolvedValue("fallback");

      const result = await withFallback(primary, fallback, "test");

      expect(result).toBe("primary");
      expect(fallback).not.toHaveBeenCalled();
    });

    it("returns fallback on failure", async () => {
      const primary = vi.fn().mockRejectedValue(new Error("fail"));
      const fallback = vi.fn().mockResolvedValue("fallback");

      const result = await withFallback(primary, fallback, "test");

      expect(result).toBe("fallback");
      expect(fallback).toHaveBeenCalled();
    });
  });
});
