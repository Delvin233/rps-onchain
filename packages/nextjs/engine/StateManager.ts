import type { GameState } from "./types";

// Valid state transitions
const TRANSITIONS: Record<GameState, GameState[]> = {
  waiting: ["ready"],
  ready: ["playing"],
  playing: ["revealing"],
  revealing: ["finished"],
  finished: ["ready", "waiting"],
};

export class StateManager {
  private currentState: GameState = "waiting";
  private listeners: Array<(state: GameState) => void> = [];

  constructor(initialState: GameState = "waiting") {
    this.currentState = initialState;
  }

  get state(): GameState {
    return this.currentState;
  }

  canTransition(to: GameState): boolean {
    return TRANSITIONS[this.currentState]?.includes(to) ?? false;
  }

  transition(to: GameState): boolean {
    if (!this.canTransition(to)) {
      console.warn(`Invalid transition: ${this.currentState} -> ${to}`);
      return false;
    }

    this.currentState = to;
    this.notifyListeners();
    return true;
  }

  forceTransition(to: GameState): void {
    this.currentState = to;
    this.notifyListeners();
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  reset(): void {
    this.currentState = "waiting";
    this.notifyListeners();
  }
}
