"use client";

import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { User, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { BalanceDisplay } from "~~/components/BalanceDisplay";

export default function PlayModePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
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
    <div className="min-h-screen bg-base-200 p-6 pt-12 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-glow-primary">Choose Game Mode</h1>
        <BalanceDisplay address={address} format="full" />
      </div>

      <div className="space-y-4">
        <button
          onClick={() => router.push("/play/single")}
          className="w-full bg-card/50 backdrop-blur border border-primary/20 rounded-xl p-6 hover:border-primary/50 transition-all duration-200 text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <User className="text-primary" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">Single Player</h2>
              <p className="text-sm text-base-content/60">Play against AI - Free & Instant</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/play/paid")}
          className="w-full bg-card/50 backdrop-blur border border-secondary/20 rounded-xl p-6 hover:border-secondary/50 transition-all duration-200 text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-secondary/10">
              <Users className="text-secondary" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">Multiplayer</h2>
              <p className="text-sm text-base-content/60">Stake CELO - Winner takes all</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
