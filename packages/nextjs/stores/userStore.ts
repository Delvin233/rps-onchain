import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserStore {
  // State
  address: string | null;
  username: string | null;
  isVerified: boolean;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    ties: number;
  } | null;

  // Actions
  setAddress: (address: string | null) => void;
  setUsername: (username: string | null) => void;
  setVerified: (verified: boolean) => void;
  setStats: (stats: UserStore["stats"]) => void;
  reset: () => void;
}

const initialState = {
  address: null,
  username: null,
  isVerified: false,
  stats: null,
};

export const useUserStore = create<UserStore>()(
  persist(
    set => ({
      ...initialState,

      // Actions
      setAddress: address => set({ address }),
      setUsername: username => set({ username }),
      setVerified: isVerified => set({ isVerified }),
      setStats: stats => set({ stats }),
      reset: () => set(initialState),
    }),
    {
      name: "rps-user-storage",
    },
  ),
);
