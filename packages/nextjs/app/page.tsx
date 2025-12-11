"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Coins, Gift, Play, Target, TrendingUp, Trophy } from "lucide-react";
import { IoStatsChartOutline } from "react-icons/io5";
import { LuBrainCircuit, LuUsersRound } from "react-icons/lu";
import { useChainId, useConnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { LoginButton } from "~~/components/LoginButton";
import { MiniAppAccount } from "~~/components/MiniAppAccount";
import { RankBadge } from "~~/components/RankBadge";
import { useAuth } from "~~/contexts/AuthContext";
import { useFarcaster } from "~~/contexts/FarcasterContext";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { usePlayerStats } from "~~/hooks/usePlayerStats";
import { getRankColor, hasGradient } from "~~/lib/ranks";

// Force dynamic rendering to prevent SSR issues with AppKit
export const dynamic = "force-dynamic";

export default function Home() {
  const { address, authMethod } = useAuth();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const stats = usePlayerStats(address ?? undefined);
  const { displayName, hasEns, ensType, pfpUrl } = useDisplayName(address ?? undefined);
  const { context, isMiniAppReady } = useFarcaster();
  const { connect } = useConnect();
  const [playerRank, setPlayerRank] = useState<{
    rank: string;
    wins: number;
    nextRank: { name: string; winsNeeded: number } | null;
  } | null>(null);

  const isBaseApp =
    typeof window !== "undefined" &&
    (window.location.ancestorOrigins?.[0]?.includes("base.dev") || window.location.href.includes("base.dev/preview"));
  const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
  const isMiniApp = (isMiniAppReady && !!context) || isBaseApp || isMiniPay;

  // Don't show loading state - it causes flashing on navigation
  // The FarcasterProvider handles initialization in the background
  const isLoading = false;

  const getPlatform = (): "farcaster" | "base" | "minipay" => {
    if (isBaseApp) return "base";
    if (isMiniPay) return "minipay";
    if (isMiniAppReady && context) return "farcaster";
    return "farcaster"; // Fallback
  };

  // Removed debug logging for production

  // Auto-connect for all miniapps (Base, MiniPay, and Farcaster)
  useEffect(() => {
    if (address) return;

    // Auto-connect for Farcaster miniapp
    if (isMiniAppReady && context && authMethod === "farcaster") {
      // Find the Farcaster connector and connect it
      import("@farcaster/miniapp-wagmi-connector")
        .then(({ farcasterMiniApp }) => {
          const farcasterConnector = farcasterMiniApp();
          connect({ connector: farcasterConnector });
        })
        .catch((error: Error) => {
          console.error("[HomePage] Farcaster connector failed:", error);
        });
    }
    // Auto-connect wallet for Base app and MiniPay
    else if ((isBaseApp || isMiniPay) && typeof window !== "undefined" && window.ethereum) {
      (window.ethereum.request as any)({ method: "eth_requestAccounts", params: [] })
        .then(() => {
          connect({ connector: injected() });
        })
        .catch((error: Error) => {
          console.error("[HomePage] Auto-connect failed:", error);
        });
    }
  }, [isBaseApp, isMiniPay, isMiniAppReady, context, address, connect, authMethod]);

  // Enforce network restrictions for miniapps
  useEffect(() => {
    if (!address) return;

    // Base app: Force Base network
    if (isBaseApp && chainId !== 8453) {
      try {
        switchChain({ chainId: 8453 });
      } catch (error) {
        console.error("Failed to switch to Base:", error);
      }
    }
    // MiniPay: Force Celo network
    else if (isMiniPay && chainId !== 42220) {
      try {
        switchChain({ chainId: 42220 });
      } catch (error) {
        console.error("Failed to switch to Celo:", error);
      }
    }
  }, [isBaseApp, isMiniPay, address, chainId, switchChain]);

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

      // Fetch player rank
      fetch(`/api/leaderboard/ai/player?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPlayerRank({
              rank: data.data.rank,
              wins: data.data.wins,
              nextRank: data.data.nextRank,
            });
          }
        })
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const statsData = [
    {
      title: "AI Rank",
      value: playerRank?.rank || "Unranked",
      icon: Trophy,
      subtitle: playerRank?.nextRank
        ? `Next: ${playerRank.nextRank.name} (${playerRank.nextRank.winsNeeded} wins)`
        : playerRank?.rank === "Unranked"
          ? "Win AI matches to earn ranks"
          : "Maximum Rank!",
      isRank: true,
      rankData: playerRank,
      onClick: () => router.push("/leaderboards/ai"),
    },
    {
      title: "Total Games",
      value: stats.totalGames.toString(),
      icon: IoStatsChartOutline,
      subtitle: `AI: ${stats.ai?.totalGames || 0} | PvP: ${stats.multiplayer?.totalGames || 0}`,
    },
    {
      title: "AI Wins",
      value: `${stats.ai?.wins || 0}/${stats.ai?.totalGames || 0}`,
      icon: LuBrainCircuit,
      subtitle: `${stats.ai?.winRate || 0}% win rate`,
    },
    {
      title: "PvP Wins",
      value: `${stats.multiplayer?.wins || 0}/${stats.multiplayer?.totalGames || 0}`,
      icon: LuUsersRound,
      subtitle: `${stats.multiplayer?.winRate || 0}% win rate`,
    },
  ];

  return (
    <div className="w-full bg-base-200">
      {isLoading ? (
        <div className="pt-8 lg:py-8">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold mb-3 animate-glow" style={{ color: "var(--color-primary)" }}>
              RPS-onChain
            </h1>
            <p className="text-base lg:text-lg text-base-content/60">
              {isBaseApp
                ? "Free-to-play Rock Paper Scissors on Base."
                : isMiniPay
                  ? "Free-to-play Rock Paper Scissors on Celo."
                  : "Free-to-play Rock Paper Scissors on Celo & Base."}
            </p>
          </div>
          <div className="mb-6 flex flex-col items-center justify-center gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm text-base-content/60">Connecting to Farcaster...</p>
          </div>
        </div>
      ) : !address ? (
        <div className="pt-8 lg:py-8">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold mb-3 animate-glow" style={{ color: "var(--color-primary)" }}>
              RPS-onChain
            </h1>
            <p className="text-base lg:text-lg text-base-content/60">
              {isBaseApp
                ? "Free-to-play Rock Paper Scissors on Base."
                : isMiniPay
                  ? "Free-to-play Rock Paper Scissors on Celo."
                  : "Free-to-play Rock Paper Scissors on Celo & Base."}
            </p>
          </div>

          {isMiniPay && (
            <div className="mb-6 flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}

          {!isMiniApp && (
            <div className="mb-12 flex justify-center w-full">
              <LoginButton />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
            <div className="bg-card/50 rounded-xl p-6 border border-primary/20 transition-all duration-200 hover:border-primary/50">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Target size={24} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Provably Fair</h3>
                  <p className="text-sm text-base-content/60">
                    Smart contract ensures no cheating. Every move is verifiable on-chain.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 rounded-xl p-6 border border-secondary/20 transition-all duration-200 hover:border-secondary/50">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <Coins size={24} style={{ color: "var(--color-secondary)" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Free to Play</h3>
                  <p className="text-sm text-base-content/60">
                    No betting required. Just pure fun with friends and AI opponents.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 rounded-xl p-6 border border-accent/20 transition-all duration-200 hover:border-accent/50">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <TrendingUp size={24} style={{ color: "var(--color-accent)" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Track Your Stats</h3>
                  <p className="text-sm text-base-content/60">
                    View match history, win rates, and achievements stored on IPFS.
                  </p>
                </div>
              </div>
            </div>

            {!isBaseApp && (
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-200">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-yellow-500/20 mt-1">
                    <Gift className="text-yellow-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Claim Daily GoodDollar</h3>
                    <p className="text-sm text-base-content/60">
                      {isMiniPay
                        ? "Get free G$ tokens daily on Celo!"
                        : "Get free G$ tokens daily. Connect your wallet to start claiming!"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card/50 rounded-xl p-6 lg:col-span-2 max-w-2xl mx-auto border border-primary/30">
            <h3 className="text-lg font-bold mb-4 text-center">How to Play</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(var(--color-primary-rgb, 16, 185, 129), 0.2)" }}
                >
                  <span className="text-xs font-bold">1</span>
                </div>
                <p className="text-sm text-base-content/80">Connect your wallet to start playing</p>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(var(--color-primary-rgb, 16, 185, 129), 0.2)" }}
                >
                  <span className="text-xs font-bold">2</span>
                </div>
                <p className="text-sm text-base-content/80">Create a room or join with a 6-character code</p>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(var(--color-primary-rgb, 16, 185, 129), 0.2)" }}
                >
                  <span className="text-xs font-bold">3</span>
                </div>
                <p className="text-sm text-base-content/80">Choose Rock, Paper, or Scissors and submit your move</p>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(var(--color-primary-rgb, 16, 185, 129), 0.2)" }}
                >
                  <span className="text-xs font-bold">4</span>
                </div>
                <p className="text-sm text-base-content/80">Results are determined instantly and recorded on-chain</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-4 lg:py-4">
          {isMiniApp ? (
            <div className="mb-6 max-w-md mx-auto">
              <MiniAppAccount platform={getPlatform()} />
            </div>
          ) : (
            <div className="bg-card/50 rounded-xl p-6 text-center mb-6 max-w-2xl mx-auto border border-primary/30">
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
          )}

          <button
            onClick={() => router.push("/play")}
            className="w-full max-w-md mx-auto hover:scale-105 transform transition-all duration-200 text-lg font-semibold rounded-xl py-4 flex items-center justify-center space-x-2 mb-8"
            style={{
              background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
              color: "var(--color-primary-content)",
            }}
          >
            <Play size={20} />
            <span>Play Now</span>
          </button>
        </div>
      )}

      {address && (
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--color-secondary)" }}>
            Your Stats
          </h2>
          {stats.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-3 bg-card/50 border border-border">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {statsData.map((stat, index) => {
                const Icon = stat.icon;
                const isRankCard = stat.isRank;
                const rankColor =
                  isRankCard && stat.rankData && stat.rankData.rank !== "Unranked"
                    ? getRankColor(stat.rankData.rank)
                    : null;
                const hasGradientBorder =
                  isRankCard && stat.rankData && stat.rankData.rank !== "Unranked"
                    ? hasGradient(stat.rankData.rank)
                    : false;

                // Determine border styling
                const borderStyle =
                  isRankCard && rankColor ? `2px solid ${rankColor}` : "1px solid rgba(255, 255, 255, 0.2)";
                const boxShadowStyle = isRankCard && rankColor ? `0 0 20px ${rankColor}40` : "none";

                return (
                  <div
                    key={stat.title}
                    onClick={stat.onClick}
                    className={`rounded-xl p-4 mb-3 bg-card/50 animate-fade-in transition-all ${
                      stat.onClick ? "cursor-pointer hover:scale-[1.02]" : ""
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      border: borderStyle,
                      boxShadow: boxShadowStyle,
                      background: hasGradientBorder
                        ? `linear-gradient(var(--fallback-b1,oklch(var(--b1))), var(--fallback-b1,oklch(var(--b1)))) padding-box, ${rankColor} border-box`
                        : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-base-content/60 text-xs mb-1">{stat.title}</p>
                        {isRankCard && stat.rankData && stat.rankData.rank !== "Unranked" ? (
                          <div className="mb-1">
                            <RankBadge rank={stat.rankData.rank} size="sm" />
                          </div>
                        ) : (
                          <p className="text-xl font-bold truncate">{stat.value}</p>
                        )}
                        {stat.subtitle && <p className="text-base-content/60 text-xs mt-1 truncate">{stat.subtitle}</p>}
                      </div>
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: "rgba(var(--color-primary-rgb, 16, 185, 129), 0.1)" }}
                      >
                        <Icon size={20} style={{ color: "var(--color-primary)" }} />
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
