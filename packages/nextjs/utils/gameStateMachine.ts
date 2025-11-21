// React import for hook
import React from "react";

// State machine for game flow - like fighting game character states
// Ensures valid transitions and predictable behavior

export type GamePhase = "IDLE" | "WAITING" | "READY" | "PLAYING" | "REVEALING" | "FINISHED";

export type Move = "rock" | "paper" | "scissors";

export interface GameState {
  phase: GamePhase;
  roomId: string | null;
  playerMove: Move | null;
  opponentMove: Move | null;
  result: "win" | "lose" | "tie" | null;
  error: string | null;
  timestamp: number;
}

export type GameAction =
  | { type: "CREATE_ROOM"; roomId: string }
  | { type: "JOIN_ROOM"; roomId: string }
  | { type: "OPPONENT_JOINED" }
  | { type: "SUBMIT_MOVE"; move: Move }
  | { type: "REVEAL"; opponentMove: Move; result: "win" | "lose" | "tie" }
  | { type: "FINISH" }
  | { type: "RESET" }
  | { type: "ERROR"; error: string };

// Valid state transitions
const transitions: Record<GamePhase, GamePhase[]> = {
  IDLE: ["WAITING", "READY"],
  WAITING: ["READY", "IDLE"],
  READY: ["PLAYING", "IDLE"],
  PLAYING: ["REVEALING", "IDLE"],
  REVEALING: ["FINISHED", "IDLE"],
  FINISHED: ["IDLE"],
};

export function createInitialState(): GameState {
  return {
    phase: "IDLE",
    roomId: null,
    playerMove: null,
    opponentMove: null,
    result: null,
    error: null,
    timestamp: Date.now(),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const newState = { ...state, timestamp: Date.now() };

  switch (action.type) {
    case "CREATE_ROOM":
    case "JOIN_ROOM":
      if (!canTransition(state.phase, "WAITING")) return state;
      return { ...newState, phase: "WAITING", roomId: action.roomId, error: null };

    case "OPPONENT_JOINED":
      if (!canTransition(state.phase, "READY")) return state;
      return { ...newState, phase: "READY", error: null };

    case "SUBMIT_MOVE":
      if (!canTransition(state.phase, "PLAYING")) return state;
      return { ...newState, phase: "PLAYING", playerMove: action.move, error: null };

    case "REVEAL":
      if (!canTransition(state.phase, "REVEALING")) return state;
      return {
        ...newState,
        phase: "REVEALING",
        opponentMove: action.opponentMove,
        result: action.result,
        error: null,
      };

    case "FINISH":
      if (!canTransition(state.phase, "FINISHED")) return state;
      return { ...newState, phase: "FINISHED", error: null };

    case "RESET":
      return createInitialState();

    case "ERROR":
      return { ...newState, error: action.error };

    default:
      return state;
  }
}

function canTransition(from: GamePhase, to: GamePhase): boolean {
  return transitions[from]?.includes(to) ?? false;
}

// Hook for using state machine
export function useGameStateMachine() {
  const [state, dispatch] = React.useReducer(gameReducer, createInitialState());

  return { state, dispatch };
}
