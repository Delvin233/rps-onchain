import { useState } from "react";
import toast from "react-hot-toast";

/**
 * Hook to automatically update leaderboard after AI match completion
 *
 * This hook provides a function to update the leaderboard when a player
 * wins an AI match. It handles rank change notifications and error states.
 */
export function useAIMatchCompletion() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateLeaderboard = async (address: string, won: boolean) => {
    if (!address || !won) return;

    setIsUpdating(true);

    try {
      const response = await fetch("/api/leaderboard/ai/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, won }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Show rank up notification
        if (result.data.rankChanged) {
          toast.success(`🎉 Rank Up! You are now ${result.data.rank}!`, {
            duration: 5000,
            style: {
              background: "#10B981",
              color: "#fff",
              fontWeight: "bold",
            },
          });
        }

        return result.data;
      } else {
        console.error("[Leaderboard] Update failed:", result.error);
      }
    } catch (error) {
      console.error("[Leaderboard] Failed to update leaderboard:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateLeaderboard, isUpdating };
}
