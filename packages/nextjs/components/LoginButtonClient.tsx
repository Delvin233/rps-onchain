"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useSafeAccount } from "~~/hooks/useSafeAccount";

interface LoginButtonClientProps {
  size?: "sm" | "lg";
}

export const LoginButtonClient = ({ size = "lg" }: LoginButtonClientProps) => {
  // Use the official AppKit hook
  const { open } = useAppKit();

  const { address: wagmiAddress, isConnected: wagmiConnected } = useSafeAccount();
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount();

  // Use the same logic as AuthContext - AppKit takes priority for social logins
  const isConnected = appKitConnected || wagmiConnected;
  const address = appKitAddress || wagmiAddress;

  const sizeClasses =
    size === "sm"
      ? "text-sm font-semibold rounded-lg py-2 px-6"
      : "text-lg font-semibold rounded-xl py-4 w-full max-w-md";

  // Format address for display
  const displayText = isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Login";

  const handleClick = () => {
    console.log("[LoginButtonClient] Login button clicked - using official useAppKit hook");
    console.log("[LoginButtonClient] Attempting to open AppKit");

    try {
      if (open) {
        console.log("[LoginButtonClient] AppKit open function found, calling it");
        open();
      } else {
        console.error("[LoginButtonClient] Could not find AppKit to open");
      }
    } catch (error) {
      console.error("[LoginButtonClient] Error opening AppKit:", error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`hover:scale-105 transform transition-all duration-200 ${sizeClasses}`}
      style={{
        background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
        color: "var(--color-primary-content)",
      }}
    >
      {displayText}
    </button>
  );
};
