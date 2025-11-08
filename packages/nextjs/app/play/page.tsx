"use client";

import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { User, Users } from "lucide-react";

export default function PlayModePage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-6 py-20">
        <div className="text-center">
          <p className="text-base-content/60 mb-6">Connect wallet to play</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 pb-24">
      <h1 className="text-2xl font-bold text-glow-primary mb-6">Choose Game Mode</h1>

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
          onClick={() => router.push("/play/multiplayer")}
          className="w-full bg-card/50 backdrop-blur border border-secondary/20 rounded-xl p-6 hover:border-secondary/50 transition-all duration-200 text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-secondary/10">
              <Users className="text-secondary" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">Multiplayer</h2>
              <p className="text-sm text-base-content/60">Play with friends - Stake CELO</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
