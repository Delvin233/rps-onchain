import { matchDataPool } from "../../utils/objectPool";
import { beforeEach, describe, expect, it } from "vitest";

describe("objectPool", () => {
  beforeEach(() => {
    // Clear pool between tests
    while (matchDataPool["available"].length > 0) {
      matchDataPool["available"].pop();
    }
    matchDataPool["inUse"].clear();
  });

  describe("matchDataPool", () => {
    it("acquires object from pool", () => {
      const match = matchDataPool.acquire();
      expect(match).toBeDefined();
      expect(match.roomId).toBe("");
    });

    it("reuses released objects", () => {
      const match1 = matchDataPool.acquire();
      match1.roomId = "TEST123";
      matchDataPool.release(match1);

      const match2 = matchDataPool.acquire();
      expect(match2.roomId).toBe(""); // Should be reset
    });

    it("tracks objects in use", () => {
      const match1 = matchDataPool.acquire();
      matchDataPool.acquire();

      expect(matchDataPool["inUse"].size).toBe(2);

      matchDataPool.release(match1);
      expect(matchDataPool["inUse"].size).toBe(1);
    });

    it("creates new objects when pool is empty", () => {
      const matches = [];
      for (let i = 0; i < 5; i++) {
        matches.push(matchDataPool.acquire());
      }
      expect(matches.length).toBe(5);
    });
  });
});
