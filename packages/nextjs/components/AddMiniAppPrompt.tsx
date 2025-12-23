"use client";

import { useCallback, useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { X } from "lucide-react";
import { useFarcaster } from "~~/contexts/FarcasterContext";

interface AddMiniAppPromptProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const STORAGE_KEY = "rps_miniapp_prompt_dismissed";

/**
 * Component to prompt users to add the Mini App to their Farcaster client
 * This enables notifications and better integration
 * Shows only once - remembers dismissal in localStorage
 */
export function AddMiniAppPrompt({ onSuccess, onError, className, children }: AddMiniAppPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [isDismissed, setIsDismissed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { context } = useFarcaster();

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsDismissed(true);
  }, []);

  const handleSuccess = useCallback(() => {
    // Auto-dismiss after successful addition
    handleDismiss();
    onSuccess?.();
  }, [handleDismiss, onSuccess]);

  const handleAddMiniApp = useCallback(async () => {
    if (!context) {
      const error = "Farcaster context not available";
      setResult(error);
      onError?.(error);
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[AddMiniApp] Attempting to add mini app...");
      }

      const response = await sdk.actions.addMiniApp();

      if (process.env.NODE_ENV === "development") {
        console.log("[AddMiniApp] Response:", response);
      }

      if (response.notificationDetails) {
        const successMsg = "🎉 Mini App added with notifications enabled!";
        setResult(successMsg);
        handleSuccess();

        if (process.env.NODE_ENV === "development") {
          console.log("[AddMiniApp] Notification token:", response.notificationDetails.token);
        }
      } else {
        const successMsg = "✅ Mini App added successfully!";
        setResult(successMsg);
        handleSuccess();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add Mini App";

      if (process.env.NODE_ENV === "development") {
        console.error("[AddMiniApp] Error:", error);
      }

      // Handle specific error cases
      if (errorMsg.includes("RejectedByUser")) {
        setResult("❌ User cancelled adding the Mini App");
        // Auto-dismiss on user rejection to avoid being annoying
        setTimeout(handleDismiss, 2000);
      } else if (errorMsg.includes("InvalidDomainManifestJson")) {
        setResult("⚠️ Invalid domain or manifest - please contact support");
      } else {
        setResult(`❌ Error: ${errorMsg}`);
      }

      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [context, handleSuccess, onError, handleDismiss]);

  // Check if already added (optional UI enhancement)
  const isAlreadyAdded = context?.client?.added;

  // Don't render during SSR or if dismissed or already added
  if (!isClient || isDismissed || isAlreadyAdded) {
    return null;
  }

  return (
    <div className={`p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg relative ${className || ""}`}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-blue-300 hover:text-blue-100 hover:bg-blue-800/30 rounded transition-colors"
        aria-label="Dismiss notification prompt"
      >
        <X size={16} />
      </button>

      <div className="space-y-3 pr-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔔</span>
          <h3 className="font-semibold text-blue-300">Enable Notifications</h3>
        </div>

        <p className="text-sm text-blue-200">
          Add RPS-onChain to your Farcaster client to receive daily GoodDollar claim reminders and game notifications.
        </p>

        <button
          onClick={handleAddMiniApp}
          disabled={isLoading}
          className={`
            w-full px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${
              isLoading
                ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg"
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Adding Mini App...
            </span>
          ) : (
            children || "🚀 Add Mini App & Enable Notifications"
          )}
        </button>

        {result && (
          <div
            className={`
            text-sm p-2 rounded border
            ${
              result.includes("🎉") || result.includes("✅")
                ? "bg-green-900/20 border-green-500/30 text-green-300"
                : "bg-red-900/20 border-red-500/30 text-red-300"
            }
          `}
          >
            {result}
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <p>• Notifications help you never miss daily rewards</p>
          <p>• You can disable anytime in Farcaster settings</p>
          <p>• Works in Warpcast, Base App, and other Farcaster clients</p>
        </div>
      </div>
    </div>
  );
}
