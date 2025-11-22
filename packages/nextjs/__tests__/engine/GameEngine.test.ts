import { GameEngine } from "../../engine/GameEngine";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock fetch
global.fetch = vi.fn();

describe("GameEngine", () => {
  let engine: GameEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new GameEngine({
      roomId: "TEST123",
      playerAddress: "0x123",
      mode: "multiplayer",
    });
  });

  it("initializes with idle state", () => {
    expect(engine.getState()).toBe("waiting");
  });

  it("calculates win correctly", () => {
    const result = engine.calculateResult("rock", "scissors");
    expect(result).toBe("win");
  });

  it("calculates lose correctly", () => {
    const result = engine.calculateResult("rock", "paper");
    expect(result).toBe("lose");
  });

  it("calculates tie correctly", () => {
    const result = engine.calculateResult("rock", "rock");
    expect(result).toBe("tie");
  });

  it("prevents move submission in wrong state", async () => {
    const result = await engine.submitMove("rock");
    expect(result).toBe(false);
  });

  it("notifies subscribers on data change", () => {
    let notified = false;
    engine.subscribe(() => {
      notified = true;
    });

    // Simulate server update
    engine["handleServerUpdate"]({
      roomId: "TEST123",
      mode: "multiplayer",
      state: "ready",
      player1: { address: "0x123", isReady: true },
    });

    expect(notified).toBe(true);
  });
});
