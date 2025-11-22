import { determineWinner } from "../../utils/gameUtils";
import { describe, expect, it } from "vitest";

describe("gameUtils", () => {
  describe("determineWinner", () => {
    it("rock beats scissors", () => {
      expect(determineWinner("rock", "scissors")).toBe("win");
    });

    it("scissors beats paper", () => {
      expect(determineWinner("scissors", "paper")).toBe("win");
    });

    it("paper beats rock", () => {
      expect(determineWinner("paper", "rock")).toBe("win");
    });

    it("scissors loses to rock", () => {
      expect(determineWinner("scissors", "rock")).toBe("lose");
    });

    it("paper loses to scissors", () => {
      expect(determineWinner("paper", "scissors")).toBe("lose");
    });

    it("rock loses to paper", () => {
      expect(determineWinner("rock", "paper")).toBe("lose");
    });

    it("same moves result in tie", () => {
      expect(determineWinner("rock", "rock")).toBe("tie");
      expect(determineWinner("paper", "paper")).toBe("tie");
      expect(determineWinner("scissors", "scissors")).toBe("tie");
    });
  });
});
