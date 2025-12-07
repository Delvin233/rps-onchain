"use client";

import { Shield } from "lucide-react";
import { LoginButton } from "~~/components/LoginButton";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";

export default function LeaderboardsPage() {
  const { isConnected, isConnecting } = useConnectedAddress();

  // Show loading while wagmi is still connecting/hydrating
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 animate-glow" style={{ color: "var(--color-primary)" }}>
              Leaderboards
            </h1>
          </div>
          {isMiniPay ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <LoginButton />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pt-4 lg:pt-0 pb-16 lg:pb-0">
      <h1
        className="text-lg sm:text-xl md:text-2xl font-bold mb-4 break-words"
        style={{ color: "var(--color-primary)" }}
      >
        Leaderboards
      </h1>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-12">
        <Shield className="text-primary mb-4" size={64} />
        <h2 className="text-xl font-semibold mb-2">Coming Soon!</h2>
        <p className="text-base-content/60 text-center max-w-md">
          Leaderboards will showcase top players, win streaks, and competitive rankings.
        </p>
      </div>
    </div>
  );
}
