"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { User, Users } from "lucide-react";
import { IoInformationCircle } from "react-icons/io5";
import { useAccount } from "wagmi";

export default function PlayModePage() {
  const router = useRouter();
  const { isConnected, isConnecting } = useAccount();
  const [showTooltip, setShowTooltip] = useState(false);
  const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;

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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-glow-primary mb-3 animate-glow">Ready to Play?</h1>
          </div>
          {isMiniPay ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="w-full">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="w-full bg-gradient-primary hover:scale-105 transform transition-all duration-200 text-lg font-semibold shadow-glow-primary rounded-xl py-4 px-6"
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 py-4">
      <div className="mb-[3vh]">
        <button onClick={() => router.push("/")} className="btn btn-sm btn-outline mb-2">
          ← Back to Home
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-glow-primary" style={{ fontSize: "clamp(1.125rem, 4vw, 1.875rem)" }}>
            Choose Game Mode
          </h1>
          <div className="relative">
            <IoInformationCircle
              className="text-base-content/40 hover:text-base-content/60 cursor-pointer flex-shrink-0"
              size={16}
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div
                className="absolute right-0 top-8 w-64 sm:w-80 bg-base-300 border border-primary/30 rounded-lg p-3 z-50 shadow-lg animate-fade-in cursor-pointer"
                onClick={() => setShowTooltip(false)}
              >
                <p className="text-xs text-base-content/80">
                  <strong>Testing tip:</strong> To test multiplayer with different accounts, use separate browsers
                  (e.g., Chrome + Firefox). Switching accounts in the same browser shares localStorage and may cause
                  silent failures.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2vh] max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/play/single")}
          className="bg-card/50 backdrop-blur border border-primary/20 rounded-xl hover:border-primary/50 hover:scale-105 transition-all duration-200 text-center"
          style={{ padding: "clamp(1rem, 3vh, 2rem)" }}
        >
          <div className="flex flex-col items-center" style={{ gap: "clamp(0.5rem, 2vh, 1rem)" }}>
            <div className="rounded-lg bg-primary/10" style={{ padding: "clamp(0.5rem, 2vh, 1rem)" }}>
              <User
                className="text-primary"
                style={{ width: "clamp(32px, 6vw, 48px)", height: "clamp(32px, 6vw, 48px)" }}
              />
            </div>
            <div>
              <h2
                className="font-semibold"
                style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)", marginBottom: "clamp(0.25rem, 1vh, 0.5rem)" }}
              >
                Single Player
              </h2>
              <p className="text-base-content/60" style={{ fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}>
                Play against AI - Free & Instant
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/play/multiplayer")}
          className="bg-card/50 backdrop-blur border border-secondary/20 rounded-xl hover:border-secondary/50 hover:scale-105 transition-all duration-200 text-center"
          style={{ padding: "clamp(1rem, 3vh, 2rem)" }}
        >
          <div className="flex flex-col items-center" style={{ gap: "clamp(0.5rem, 2vh, 1rem)" }}>
            <div className="rounded-lg bg-secondary/10" style={{ padding: "clamp(0.5rem, 2vh, 1rem)" }}>
              <Users
                className="text-secondary"
                style={{ width: "clamp(32px, 6vw, 48px)", height: "clamp(32px, 6vw, 48px)" }}
              />
            </div>
            <div>
              <h2
                className="font-semibold"
                style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)", marginBottom: "clamp(0.25rem, 1vh, 0.5rem)" }}
              >
                Multiplayer
              </h2>
              <p className="text-base-content/60" style={{ fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}>
                Play with friends - Free & Fun
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
