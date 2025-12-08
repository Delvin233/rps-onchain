import { useState } from "react";
import toast from "react-hot-toast";

// Simple confetti effect
const triggerConfetti = () => {
  // Create confetti particles
  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.style.position = "fixed";
    confetti.style.width = "10px";
    confetti.style.height = "10px";
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * window.innerWidth + "px";
    confetti.style.top = "-10px";
    confetti.style.opacity = "1";
    confetti.style.pointerEvents = "none";
    confetti.style.zIndex = "9999";
    confetti.style.borderRadius = "50%";

    document.body.appendChild(confetti);

    const duration = Math.random() * 3 + 2;
    const xMovement = (Math.random() - 0.5) * 200;

    confetti.animate(
      [
        { transform: "translateY(0) translateX(0) rotate(0deg)", opacity: 1 },
        {
          transform: `translateY(${window.innerHeight}px) translateX(${xMovement}px) rotate(${Math.random() * 360}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: duration * 1000,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    ).onfinish = () => {
      confetti.remove();
    };
  }
};

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
        // Show rank up notification with confetti
        if (result.data.rankChanged) {
          triggerConfetti();
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
        // Handle rate limiting
        if (response.status === 429) {
          console.log("[Leaderboard] Rate limited, will update on next win");
        } else {
          console.error("[Leaderboard] Update failed:", result.error);
        }
      }
    } catch (error) {
      console.error("[Leaderboard] Failed to update leaderboard:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateLeaderboard, isUpdating };
}
