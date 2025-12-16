"use client";

import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useSafeAccount } from "~~/hooks/useSafeAccount";

interface LoginButtonClientProps {
  size?: "sm" | "lg";
}

export const LoginButtonClient = ({ size = "lg" }: LoginButtonClientProps) => {
  const [isClient, setIsClient] = useState(false);
  const [appKitOpen, setAppKitOpen] = useState<(() => void) | null>(null);

  const { address: wagmiAddress, isConnected: wagmiConnected } = useSafeAccount();
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount();

  // Ensure we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Try to get the AppKit open function
  useEffect(() => {
    if (!isClient) return;

    const getAppKitOpen = async () => {
      try {
        // Wait a bit for AppKit to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        await import("@reown/appkit/react");

        // This is a hack, but we need to get the open function somehow
        // In a real component, useAppKit would be called at the top level
        console.log("[LoginButtonClient] AppKit hook available");

        // Try to find AppKit elements or use global instance
        const openFunction = () => {
          console.log("[LoginButtonClient] Attempting to open AppKit");

          // Method 1: Try global instance
          if ((window as any).appkit && typeof (window as any).appkit.open === "function") {
            (window as any).appkit.open();
            return;
          }

          // Method 2: Try to find and click AppKit button
          const button = document.querySelector("w3m-connect-button") as HTMLElement;
          if (button) {
            button.click();
            return;
          }

          // Method 3: Try modal directly
          const modal = document.querySelector("w3m-modal") as any;
          if (modal && typeof modal.open === "function") {
            modal.open();
            return;
          }

          console.warn("[LoginButtonClient] Could not find AppKit to open");
        };

        setAppKitOpen(() => openFunction);
      } catch (error) {
        console.error("[LoginButtonClient] Error getting AppKit:", error);
      }
    };

    getAppKitOpen();
  }, [isClient]);

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
    console.log("[LoginButtonClient] Login button clicked");

    if (appKitOpen) {
      appKitOpen();
    } else {
      console.warn("[LoginButtonClient] AppKit open function not available");

      // Fallback: try to find any AppKit element and click it
      const appKitElements = document.querySelectorAll(
        'w3m-connect-button, [data-testid="connect-button"], w3m-button',
      );
      if (appKitElements.length > 0) {
        (appKitElements[0] as HTMLElement).click();
      }
    }
  };

  if (!isClient) {
    return null;
  }

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
