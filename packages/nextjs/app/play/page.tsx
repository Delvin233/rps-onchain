"use client";

import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { User, Users } from "lucide-react";
import { useAccount } from "wagmi";

export default function PlayModePage() {
  const router = useRouter();
  const { isConnected } = useAccount();

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
      <h1 className="text-3xl lg:text-4xl font-bold text-glow-primary mb-8 pt-4 lg:pt-0">Choose Game Mode</h1>

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
              <h2 className="text-2xl font-semibold mb-2">Single Player</h2>
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
              <h2 className="text-2xl font-semibold mb-2">Multiplayer</h2>
              <p className="text-base-content/60">Play with friends - Free & Fun</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
