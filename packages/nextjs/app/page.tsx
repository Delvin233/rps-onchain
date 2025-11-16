"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Coins, Gift, Play, Target, TrendingUp } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { useFarcaster } from "~~/contexts/FarcasterContext";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { usePlayerStats } from "~~/hooks/usePlayerStats";

export default function Home() {
  const { address } = useAccount();
  const router = useRouter();
  const stats = usePlayerStats(address);
  const { displayName, hasEns, ensType, pfpUrl } = useDisplayName(address);
  const { context, isMiniAppReady } = useFarcaster();
  const { connect, connectors } = useConnect();

  const farcasterConnector = connectors.find(c => c.id === "farcasterMiniApp");

  // Auto-connect Farcaster users when miniapp context is ready
  useEffect(() => {
    if (!address && isMiniAppReady && farcasterConnector && context) {
      connect({ connector: farcasterConnector });
    }
  }, [isMiniAppReady, farcasterConnector, context, address, connect]);

  useEffect(() => {
    if (address) {
      // Auto-migrate existing users from IPFS to Redis
      fetch("/api/migrate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
        .then(() => {
          stats.refetch();
        })
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const statsData = [
    {
      title: "Total Games",
      value: stats.totalGames.toString(),
      icon: Target,
      subtitle: `AI: ${stats.ai?.totalGames || 0} | PvP: ${stats.multiplayer?.totalGames || 0}`,
    },
    {
      title: "AI Wins",
      value: `${stats.ai?.wins || 0}/${stats.ai?.totalGames || 0}`,
      icon: TrendingUp,
      subtitle: `${stats.ai?.winRate || 0}% win rate`,
    },
    {
      title: "PvP Wins",
      value: `${stats.multiplayer?.wins || 0}/${stats.multiplayer?.totalGames || 0}`,
      icon: Coins,
      subtitle: `${stats.multiplayer?.winRate || 0}% win rate`,
    },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      {!address ? (
        <div className="pt-8 lg:py-8">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold text-glow-primary mb-3 animate-glow">RPS-onChain</h1>
            <p className="text-base lg:text-lg text-base-content/60">
              Free-to-play Rock Paper Scissors on Celo & Base.
            </p>
          </div>

          <div className="mb-12 max-w-md mx-auto space-y-3">
            {isMiniAppReady && farcasterConnector ? (
              <button
                onClick={() => connect({ connector: farcasterConnector })}
                disabled={!context}
                className="w-full bg-purple-600 hover:bg-purple-700 hover:scale-105 transform transition-all duration-200 text-lg font-semibold rounded-xl py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!context ? "Loading Farcaster context..." : ""}
              >
                {context ? "Connect with Farcaster" : "Loading Farcaster..."}
              </button>
            ) : (
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
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
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
                  <h3 className="text-lg font-bold mb-1">Free to Play</h3>
                  <p className="text-sm text-base-content/60">
                    No betting required. Just pure fun with friends and AI opponents.
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
                    View match history, win rates, and achievements stored on IPFS.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-yellow-500/20 mt-1">
                  <Gift className="text-yellow-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Claim Daily GoodDollar</h3>
                  <p className="text-sm text-base-content/60">
                    Get free G$ tokens daily. Connect your wallet to start claiming!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 rounded-xl p-6 lg:col-span-2 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold mb-4 text-center">How to Play</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">1</span>
                </div>
                <p className="text-sm text-base-content/80">Connect your wallet to start playing</p>
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
                <p className="text-sm text-base-content/80">Results are determined instantly and recorded on-chain</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-4 lg:py-4">
          <div className="bg-card/50 backdrop-blur border border-primary/30 rounded-xl p-6 text-center mb-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-1">
              {pfpUrl && (
                <Image
                  src={pfpUrl}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="rounded-full"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzMzIi8+PC9zdmc+"
                  onError={e => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <p className="text-lg md:text-xl font-semibold">
                Hello, {displayName}
                {hasEns && (
                  <span
                    className={`text-xs ml-2 ${
                      ensType === "mainnet"
                        ? "text-success"
                        : ensType === "basename"
                          ? "text-primary"
                          : ensType === "farcaster"
                            ? "text-purple-500"
                            : "text-info"
                    }`}
                  >
                    {ensType === "mainnet"
                      ? "ENS"
                      : ensType === "basename"
                        ? "BASENAME"
                        : ensType === "farcaster"
                          ? "FC"
                          : "BASE"}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address);
              }}
              className="text-xs text-base-content/60 hover:text-base-content transition-colors"
              title="Copy address"
            >
              {address.slice(0, 10)}...{address.slice(-8)} 📋
            </button>
          </div>

          <button
            onClick={() => router.push("/play")}
            className="w-full max-w-md mx-auto bg-gradient-primary hover:scale-105 transform transition-all duration-200 text-lg font-semibold shadow-glow-primary rounded-xl py-4 flex items-center justify-center space-x-2 mb-8"
          >
            <Play size={20} />
            <span>Play Now</span>
          </button>
        </div>
      )}

      {address && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-glow-secondary">Your Stats</h2>
          {stats.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card/50 backdrop-blur border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="skeleton h-3 w-20 mb-2"></div>
                      <div className="skeleton h-6 w-16 mb-2"></div>
                      <div className="skeleton h-3 w-24"></div>
                    </div>
                    <div className="skeleton h-10 w-10 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                        {stat.subtitle && <p className="text-base-content/60 text-xs mt-1">{stat.subtitle}</p>}
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
