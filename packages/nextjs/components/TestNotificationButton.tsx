"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useFarcaster } from "~~/contexts/FarcasterContext";

interface TestNotificationButtonProps {
  className?: string;
}

/**
 * Button to test Neynar notifications
 * Only shows for users in Farcaster clients
 */
export function TestNotificationButton({ className }: TestNotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { context } = useFarcaster();

  const handleTestNotification = async () => {
    if (!context?.user?.fid) {
      toast.error("Farcaster user not found");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/test-neynar?fid=${context.user.fid}`);
      const result = await response.json();

      if (result.success) {
        toast.success("🎉 Test notification sent via Neynar!");
      } else {
        toast.error(`Failed to send notification: ${result.message}`);
      }
    } catch (error) {
      console.error("Test notification error:", error);
      toast.error("Failed to send test notification");
    } finally {
      setIsLoading(false);
    }
  };

  // Only show in Farcaster contexts
  if (!context?.user?.fid) {
    return null;
  }

  return (
    <button
      onClick={handleTestNotification}
      disabled={isLoading}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${
          isLoading
            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg"
        }
        ${className || ""}
      `}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Testing...
        </span>
      ) : (
        "🧪 Test Notification"
      )}
    </button>
  );
}
