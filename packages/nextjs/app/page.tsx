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
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300">
      {!address ? (
        <div className="px-6 pt-16 pb-24">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold text-glow-primary mb-3 animate-glow">RPS-onChain</h1>
            <p className="text-lg text-base-content/80 mb-2">Rock Paper Scissors on the Blockchain</p>
            <p className="text-sm text-base-content/60">Play. Bet. Win. All on Celo.</p>
          </div>

          <div className="mb-12 max-w-md mx-auto">
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

          <div className="space-y-4 mb-12">
            <div className="bg-card/50 backdrop-blur border border-primary/20 rounded-xl p-6 hover:border-primary/50 transition-all duration-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-primary/10 mt-1">
                  <Target className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Provably Fair</h3>
                  <p className="text-sm text-base-content/60">
                    Smart contract ensures no cheating. Every move is verifiable on-chain.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur border border-secondary/20 rounded-xl p-6 hover:border-secondary/50 transition-all duration-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-secondary/10 mt-1">
                  <Coins className="text-secondary" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Real Money Betting</h3>
                  <p className="text-sm text-base-content/60">
                    Stake CELO and win big. Winner takes all with instant payouts.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur border border-accent/20 rounded-xl p-6 hover:border-accent/50 transition-all duration-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-accent/10 mt-1">
                  <TrendingUp className="text-accent" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Track Your Stats</h3>
                  <p className="text-sm text-base-content/60">
                    View match history, win rates, and total earnings on IPFS.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-center">How to Play</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">1</span>
                </div>
                <p className="text-sm text-base-content/80">
                  Connect your wallet and verify identity for higher limits
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">2</span>
                </div>
                <p className="text-sm text-base-content/80">Create a room or join with a 6-character code</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">3</span>
                </div>
                <p className="text-sm text-base-content/80">Choose Rock, Paper, or Scissors and submit your move</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">4</span>
                </div>
                <p className="text-sm text-base-content/80">
                  Winner takes the full pot automatically via smart contract
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 pt-8 pb-4">
          <div className="bg-card/50 backdrop-blur border border-primary/30 rounded-xl p-3 text-center mb-6">
            <p className="text-xs text-base-content/60 mb-1">Connected</p>
            <p className="font-mono text-xs">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>

          <button
            onClick={() => router.push("/play")}
            className="w-full bg-gradient-primary hover:scale-105 transform transition-all duration-200 touch-target text-base font-semibold shadow-glow-primary rounded-xl py-3 flex items-center justify-center space-x-2 mb-6"
          >
            <Play size={20} />
            <span>Play Now</span>
          </button>
        </div>
      )}

      {address && (
        <div className="px-6">
          <h2 className="text-lg font-semibold mb-3 text-glow-secondary">Your Stats</h2>
          {stats.isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
