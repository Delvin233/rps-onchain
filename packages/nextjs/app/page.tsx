"use client";

import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Play, Target, TrendingUp, Coins } from "lucide-react";
import { usePlayerStats } from "~~/hooks/usePlayerStats";

export default function Home() {
  const { address } = useAccount();
  const router = useRouter();
  const stats = usePlayerStats(address);

  const statsData = [
    { title: "Total Games", value: stats.totalGames.toString(), icon: Target },
    { title: "Win Rate", value: `${stats.winRate}%`, icon: TrendingUp },
    { title: "Total Wagered", value: `${stats.totalWagered.toFixed(2)} CELO`, icon: Coins },
  ];

  return (
    <div className="bg-base-200">
      <div className="px-6 pt-12 pb-6">
        {!address && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-glow-primary mb-2 animate-glow">RPS Battle</h1>
            <p className="text-base-content/60 text-lg">Rock Paper Scissors on the blockchain</p>
          </div>
        )}

        <div className="mb-8">
          {!address ? (
            <div className="w-full flex justify-center">
              <ConnectButton />
            </div>
          ) : (
            <div className="bg-card/50 backdrop-blur border border-primary/30 rounded-xl p-4 text-center">
              <p className="text-sm text-base-content/60 mb-1">Connected</p>
              <p className="font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</p>
            </div>
          )}
        </div>

        {address && (
          <button
            onClick={() => router.push("/play")}
            className="w-full bg-gradient-primary hover:scale-105 transform transition-all duration-200 touch-target text-lg font-semibold shadow-glow-primary rounded-xl py-4 flex items-center justify-center space-x-2"
          >
            <Play size={20} />
            <span>Play Now</span>
          </button>
        )}
      </div>

      {address && (
        <div className="px-6">
          <h2 className="text-xl font-semibold mb-4 text-glow-secondary">Your Stats</h2>
          <div className="grid grid-cols-1 gap-4 mb-6">
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base-content/60 text-sm mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="text-primary" size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!address && (
        <div className="px-6 pb-8">
          <div className="bg-gradient-to-br from-muted/10 to-accent/5 border border-accent/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-accent">How to Play</h3>
            <div className="space-y-2 text-sm text-base-content/60">
              <p>1. Connect your wallet and verify identity</p>
              <p>2. Create or join a game room</p>
              <p>3. Choose your move and place your bet</p>
              <p>4. Wait for opponent and reveal moves</p>
              <p>5. Winner takes the pot!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
