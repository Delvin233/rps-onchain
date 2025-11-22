// Core game types
export type Move = "rock" | "paper" | "scissors";
export type GameResult = "win" | "lose" | "tie";
export type GameMode = "single" | "multiplayer";

export type GameState = "idle" | "waiting" | "ready" | "choosing" | "submitted" | "revealing" | "finished";

export interface Player {
  address: string;
  move?: Move;
  isReady: boolean;
}

export interface GameData {
  roomId: string;
  mode: GameMode;
  state: GameState;
  player1: Player;
  player2?: Player;
  result?: GameResult;
  winner?: string;
}

export interface GameConfig {
  roomId: string;
  playerAddress: string;
  mode: GameMode;
  pollingInterval?: number;
}
