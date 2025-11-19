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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex items-center gap-2 mb-8 pt-4 lg:pt-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-glow-primary break-words">
          Choose Game Mode
        </h1>
        <div className="relative">
          <IoInformationCircle
            className="text-base-content/40 hover:text-base-content/60 cursor-pointer"
            size={20}
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
          {showTooltip && (
            <div
              className="absolute left-0 top-8 w-64 sm:w-80 bg-base-300 border border-primary/30 rounded-lg p-3 z-50 shadow-lg animate-fade-in cursor-pointer"
              onClick={() => setShowTooltip(false)}
            >
              <p className="text-xs text-base-content/80">
                <strong>Testing tip:</strong> To test multiplayer with different accounts, use separate browsers (e.g.,
                Chrome + Firefox). Switching accounts in the same browser shares localStorage and may cause silent
                failures.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/play/single")}
          className="bg-card/50 backdrop-blur border border-primary/20 rounded-xl p-8 hover:border-primary/50 hover:scale-105 transition-all duration-200 text-center"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-lg bg-primary/10">
              <User className="text-primary" size={48} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 break-words">Single Player</h2>
              <p className="text-base-content/60">Play against AI - Free & Instant</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/play/multiplayer")}
          className="bg-card/50 backdrop-blur border border-secondary/20 rounded-xl p-8 hover:border-secondary/50 hover:scale-105 transition-all duration-200 text-center"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-lg bg-secondary/10">
              <Users className="text-secondary" size={48} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 break-words">Multiplayer</h2>
              <p className="text-base-content/60">Play with friends - Free & Fun</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
