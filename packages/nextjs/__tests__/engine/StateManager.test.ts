import { StateManager } from "../../engine/StateManager";
import { beforeEach, describe, expect, it } from "vitest";

describe("StateManager", () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it("initializes with idle state", () => {
    expect(stateManager.state).toBe("idle");
  });

  it("allows valid transitions", () => {
    expect(stateManager.transition("waiting")).toBe(true);
    expect(stateManager.state).toBe("waiting");
  });

  it("prevents invalid transitions", () => {
    expect(stateManager.transition("finished")).toBe(false);
    expect(stateManager.state).toBe("idle");
  });

  it("allows transition chain", () => {
    stateManager.transition("choosing");
    stateManager.transition("submitted");
    stateManager.transition("revealing");
    stateManager.transition("finished");
    expect(stateManager.state).toBe("finished");
  });

  it("notifies subscribers on state change", () => {
    let notified = false;
    stateManager.subscribe(() => {
      notified = true;
    });

    stateManager.transition("waiting");
    expect(notified).toBe(true);
  });

  it("allows unsubscribe", () => {
    let count = 0;
    const unsubscribe = stateManager.subscribe(() => {
      count++;
    });

    stateManager.transition("waiting");
    expect(count).toBe(1);

    unsubscribe();
    stateManager.transition("choosing");
    expect(count).toBe(1);
  });

  it("resets to idle", () => {
    stateManager.transition("choosing");
    stateManager.reset();
    expect(stateManager.state).toBe("idle");
  });
});
