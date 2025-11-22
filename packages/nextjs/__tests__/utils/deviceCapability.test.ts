import { getOptimizedSettings } from "../../utils/deviceCapability";
import { describe, expect, it } from "vitest";

describe("deviceCapability", () => {
  describe("getOptimizedSettings", () => {
    it("disables animations for low-end devices", () => {
      const settings = getOptimizedSettings({
        tier: "low",
        memory: 2,
        cores: 2,
        gpu: "low",
        connection: "slow",
        supportsWebP: false,
        supportsServiceWorker: true,
      });

      expect(settings.animations).toBe(false);
      expect(settings.pollingInterval).toBe(3000);
    });

    it("enables all features for high-end devices", () => {
      const settings = getOptimizedSettings({
        tier: "high",
        memory: 16,
        cores: 12,
        gpu: "high",
        connection: "fast",
        supportsWebP: true,
        supportsServiceWorker: true,
      });

      expect(settings.animations).toBe(true);
      expect(settings.pollingInterval).toBe(1000);
    });
  });
});
