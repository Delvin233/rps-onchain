import type { GameResult, GameState, Move } from "../engine/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GameStore {
  // State
  roomId: string | null;
  gameState: GameState;
  playerMove: Move | null;
  opponentMove: Move | null;
  result: GameResult | null;
  isLoading: boolean;

  // Actions
  setRoomId: (roomId: string | null) => void;
  setGameState: (state: GameState) => void;
  setPlayerMove: (move: Move | null) => void;
  setOpponentMove: (move: Move | null) => void;
  setResult: (result: GameResult | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  gameState: "idle" as GameState,
  playerMove: null,
  opponentMove: null,
  result: null,
  isLoading: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    set => ({
      ...initialState,

      // Actions
      setRoomId: roomId => set({ roomId }),
      setGameState: gameState => set({ gameState }),
      setPlayerMove: playerMove => set({ playerMove }),
      setOpponentMove: opponentMove => set({ opponentMove }),
      setResult: result => set({ result }),
      setLoading: isLoading => set({ isLoading }),
      reset: () => set(initialState),
    }),
    {
      name: "rps-game-storage", // localStorage key
      partialize: state => ({
        // Only persist these fields
        roomId: state.roomId,
        gameState: state.gameState,
      }),
    },
  ),
);
