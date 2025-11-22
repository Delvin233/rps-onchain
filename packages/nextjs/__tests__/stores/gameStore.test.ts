import { useGameStore } from "../../stores/gameStore";
import { beforeEach, describe, expect, it } from "vitest";

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it("initializes with default state", () => {
    const state = useGameStore.getState();
    expect(state.roomId).toBe(null);
    expect(state.gameState).toBe("waiting");
    expect(state.playerMove).toBe(null);
  });

  it("updates room ID", () => {
    useGameStore.getState().setRoomId("TEST123");
    expect(useGameStore.getState().roomId).toBe("TEST123");
  });

  it("updates game state", () => {
    useGameStore.getState().setGameState("ready");
    expect(useGameStore.getState().gameState).toBe("ready");
  });

  it("updates player move", () => {
    useGameStore.getState().setPlayerMove("rock");
    expect(useGameStore.getState().playerMove).toBe("rock");
  });

  it("updates result", () => {
    useGameStore.getState().setResult("win");
    expect(useGameStore.getState().result).toBe("win");
  });

  it("resets to initial state", () => {
    const { setRoomId, setGameState, setPlayerMove, reset } = useGameStore.getState();

    setRoomId("TEST123");
    setGameState("finished");
    setPlayerMove("rock");

    reset();

    const state = useGameStore.getState();
    expect(state.roomId).toBe(null);
    expect(state.gameState).toBe("waiting");
    expect(state.playerMove).toBe(null);
  });
});
