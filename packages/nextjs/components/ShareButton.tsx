"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "react-hot-toast";

export type ShareType = "room-code" | "match-result" | "room-history";
export type ShareDestination = "farcaster" | "native" | "clipboard" | "base-app";

interface ShareButtonProps {
  type: ShareType;
  roomId: string;
  matchId?: string;
  data?: {
    winner?: string;
    player1Move?: string;
    player2Move?: string;
    player1Name?: string;
    player2Name?: string;
    totalMatches?: number;
    winStreak?: number;
  };
  onShareComplete?: (destination: ShareDestination) => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function ShareButton({
  type,
  roomId,
  matchId,
  data,
  onShareComplete,
  className = "",
  variant = "secondary",
  size = "md",
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  // Generate share content
  const getShareContent = () => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://rpsonchain.xyz";

    switch (type) {
      case "room-code":
        const winStreakText =
          data?.winStreak && data.winStreak > 1
            ? `I'm on a ${data.winStreak}-game win streak!\nThink you can end it? `
            : "Think you can beat me at RPS?\n";

        return {
          title: "Join my RPS game!",
          text: `${winStreakText}Join room ${roomId} and prove it!`,
          url: `${baseUrl}/play/multiplayer?join=${roomId}`,
        };

      case "match-result":
        const isWin = data?.winner === data?.player1Name;
        const moveAbbr = data?.player1Move === "rock" ? "R" : data?.player1Move === "paper" ? "P" : "S";
        const resultText = isWin
          ? `Just crushed ${data?.player2Name || "opponent"} with ${data?.player1Move} (${moveAbbr})!`
          : `Good game against ${data?.player2Name || "opponent"}!`;

        return {
          title: "RPS Match Result",
          text: `${resultText}\nYour turn to challenge me!`,
          url: `${baseUrl}/share/match/${roomId}/${matchId}`,
        };

      case "room-history":
        return {
          title: "Epic RPS Battle History",
          text: `Epic ${data?.totalMatches || 0}-match battle!\nCheck out the full history:`,
          url: `${baseUrl}/share/room/${roomId}`,
        };

      default:
        return {
          title: "RPS-onChain",
          text: "Join me for Rock Paper Scissors!",
          url: `${baseUrl}/play/multiplayer?join=${roomId}`,
        };
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        return success;
      } catch (fallbackError) {
        console.error("Clipboard fallback failed:", fallbackError);
        return false;
      }
    }
  };

  // Native share (mobile)
  const shareNative = async (title: string, text: string, url: string): Promise<boolean> => {
    if (!navigator.share) {
      return false;
    }

    try {
      await navigator.share({
        title,
        text: `${text}\n${url}`,
        url,
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled, not an error
        return false;
      }
      console.error("Native share failed:", error);
      return false;
    }
  };

  // Main share handler
  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      const { title, text, url } = getShareContent();
      let destination: ShareDestination = "clipboard";
      let success = false;

      // Try native share first on mobile
      if (typeof window !== "undefined" && "share" in navigator) {
        success = await shareNative(title, text, url);
        if (success) {
          destination = "native";
        }
      }

      // Fallback to copy to clipboard
      if (!success) {
        const fullText = `${text}\n${url}`;
        success = await copyToClipboard(fullText);
        destination = "clipboard";

        if (success) {
          setJustCopied(true);
          toast.success("Link copied to clipboard!");

          // Reset copied state after 2 seconds
          setTimeout(() => setJustCopied(false), 2000);
        }
      }

      if (success) {
        onShareComplete?.(destination);
      } else {
        toast.error("Failed to share. Please try again.");
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("Share failed. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  // Button styling
  const getButtonClasses = () => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 hover:border-gray-400",
      ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  // Button text based on type
  const getButtonText = () => {
    if (isSharing) return "Sharing...";
    if (justCopied) return "Copied!";

    switch (type) {
      case "room-code":
        return "Share Room";
      case "match-result":
        return "Share Result";
      case "room-history":
        return "Share History";
      default:
        return "Share";
    }
  };

  // Button icon
  const getButtonIcon = () => {
    if (isSharing) {
      return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
    }
    if (justCopied) {
      return <Check className="w-4 h-4" />;
    }
    if (typeof window !== "undefined" && "share" in navigator) {
      return <Share2 className="w-4 h-4" />;
    }
    return <Copy className="w-4 h-4" />;
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={getButtonClasses()}
      title={`Share ${type.replace("-", " ")}`}
    >
      {getButtonIcon()}
      <span>{getButtonText()}</span>
    </button>
  );
}
