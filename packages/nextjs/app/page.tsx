"use client";

import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Coins, Play, Target, TrendingUp } from "lucide-react";
import { useAccount } from "wagmi";
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
      <div className="px-6 pt-8 pb-4">
        {!address && (
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-glow-primary mb-1 animate-glow">RPS Battle</h1>
            <p className="text-base-content/60 text-sm">Rock Paper Scissors on the blockchain</p>
          </div>
        )}

        <div className="mb-6">
          {!address ? (
            <div className="w-full flex justify-center">
              <ConnectButton />
            </div>
          ) : (
            <div className="bg-card/50 backdrop-blur border border-primary/30 rounded-xl p-3 text-center">
              <p className="text-xs text-base-content/60 mb-1">Connected</p>
              <p className="font-mono text-xs">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          )}
        </div>

        {address && (
          <button
            onClick={() => router.push("/play")}
            className="w-full bg-gradient-primary hover:scale-105 transform transition-all duration-200 touch-target text-base font-semibold shadow-glow-primary rounded-xl py-3 flex items-center justify-center space-x-2"
          >
            <Play size={20} />
            <span>Play Now</span>
          </button>
        )}
      </div>

      {address && (
        <div className="px-6">
          <h2 className="text-lg font-semibold mb-3 text-glow-secondary">Your Stats</h2>
          <div className="grid grid-cols-1 gap-3 mb-4">
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="bg-card/50 backdrop-blur border border-border rounded-xl p-3 hover:border-primary/50 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base-content/60 text-xs mb-1">{stat.title}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="text-primary" size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!address && (
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-br from-muted/10 to-accent/5 border border-accent/20 rounded-xl p-4">
            <h3 className="text-base font-semibold mb-2 text-accent">How to Play</h3>
            <div className="space-y-1 text-xs text-base-content/60">
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
