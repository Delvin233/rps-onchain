"use client";

import { User, Users } from "lucide-react";
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
        className="text-lg sm:text-xl md:text-2xl font-bold mb-6 break-words"
        style={{ color: "var(--color-primary)" }}
      >
        Leaderboards
      </h1>

      {/* Leaderboard Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        {/* Single Player Ranks */}
        <a
          href="/leaderboards/ai"
          className="block p-6 bg-base-100 rounded-lg border-2 border-base-300 hover:border-primary transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
        >
          <div className="flex items-start gap-4">
            <User className="text-primary flex-shrink-0" size={32} />
            <div>
              <h2 className="text-xl font-bold mb-2 text-base-content">Single Player Ranks</h2>
              <p className="text-base-content/70 text-sm">
                Compete against the RPS-AI and climb the ranks. Earn your place among the RPS-Gods!
              </p>
            </div>
          </div>
        </a>

        {/* Placeholder for future leaderboards */}
        <div className="p-6 bg-base-100 rounded-lg border-2 border-base-300 opacity-50 cursor-not-allowed">
          <div className="flex items-start gap-4">
            <Users className="text-base-content/40 flex-shrink-0" size={32} />
            <div>
              <h2 className="text-xl font-bold mb-2 text-base-content/60">Multiplayer Rankings</h2>
              <p className="text-base-content/50 text-sm">Coming soon! Compete with other players.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
