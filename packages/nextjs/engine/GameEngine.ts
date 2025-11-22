// Need to import these
import { useEffect, useState } from "react";
import { determineWinner } from "../utils/gameUtils";
import { NetworkSync } from "./NetworkSync";
import { StateManager } from "./StateManager";
import type { GameConfig, GameData, GameResult, GameState, Move } from "./types";

export class GameEngine {
  private config: GameConfig;
  private stateManager: StateManager;
  private network: NetworkSync;
  private gameData: GameData | null = null;
  private listeners: Array<(data: GameData | null) => void> = [];

  constructor(config: GameConfig) {
    this.config = config;
    this.stateManager = new StateManager();
    this.network = new NetworkSync(config.roomId, config.playerAddress, config.pollingInterval);

    // Subscribe to state changes
    this.stateManager.subscribe(state => {
      this.onStateChange(state);
    });
  }

  // Public API
  async submitMove(move: Move): Promise<boolean> {
    if (this.stateManager.state !== "choosing") {
      console.warn("Cannot submit move in current state");
      return false;
    }

    const result = await this.network.submitMove(move);

    if (result.success) {
      this.stateManager.transition("submitted");
      return true;
    }

    return false;
  }

  async requestRematch(): Promise<void> {
    await this.network.requestRematch();
  }

  async acceptRematch(): Promise<void> {
    await this.network.acceptRematch();
    this.stateManager.transition("choosing");
  }

  async leaveRoom(): Promise<void> {
    await this.network.leaveRoom();
    this.stop();
  }

  start(): void {
    this.network.startPolling(data => {
      this.handleServerUpdate(data);
    });
  }

  stop(): void {
    this.network.stopPolling();
  }

  subscribe(listener: (data: GameData | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): GameState {
    return this.stateManager.state;
  }

  getGameData(): GameData | null {
    return this.gameData;
  }

  // Private methods
  private handleServerUpdate(data: GameData | null): void {
    if (!data) return;

    this.gameData = data;
    this.syncState(data.state);
    this.notifyListeners();
  }

  private syncState(serverState: GameState): void {
    if (this.stateManager.state !== serverState) {
      this.stateManager.forceTransition(serverState);
    }
  }

  private onStateChange(state: GameState): void {
    console.log(`Game state changed: ${state}`);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.gameData));
  }

  // Helper methods
  calculateResult(playerMove: Move, opponentMove: Move): GameResult {
    return determineWinner(playerMove, opponentMove);
  }
}

// React Hook
export function useGameEngine(config: GameConfig) {
  const [engine] = useState(() => new GameEngine(config));
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = engine.subscribe(data => {
      setGameData(data);
    });

    engine.start();

    return () => {
      unsubscribe();
      engine.stop();
    };
  }, [engine]);

  const submitMove = async (move: Move) => {
    setIsLoading(true);
    await engine.submitMove(move);
    setIsLoading(false);
  };

  const requestRematch = async () => {
    setIsLoading(true);
    await engine.requestRematch();
    setIsLoading(false);
  };

  const acceptRematch = async () => {
    setIsLoading(true);
    await engine.acceptRematch();
    setIsLoading(false);
  };

  const leaveRoom = async () => {
    await engine.leaveRoom();
  };

  return {
    gameData,
    state: engine.getState(),
    isLoading,
    submitMove,
    requestRematch,
    acceptRematch,
    leaveRoom,
  };
}
