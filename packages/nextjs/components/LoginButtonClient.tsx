"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";

interface LoginButtonClientProps {
  size?: "sm" | "lg";
}

export const LoginButtonClient = ({ size = "lg" }: LoginButtonClientProps) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  const sizeClasses =
    size === "sm"
      ? "text-sm font-semibold rounded-lg py-2 px-6"
      : "text-lg font-semibold rounded-xl py-4 w-full max-w-md";

  // Format address for display
  const displayText = isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Login";

  return (
    <button
      onClick={() => open()}
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
