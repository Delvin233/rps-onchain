"use client";

import { useEffect, useState } from "react";
import { Clock, Coins, Target, TrendingUp, Trophy, Users } from "lucide-react";
import { useAuth } from "~~/contexts/AuthContext";

interface RewardData {
  season: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  payout: {
    nextPayoutDate: string;
    timeUntilPayout: string;
    totalRewards: number;
    maxPossibleRewards: number;
  };
  leaderboard: Array<{
    address: string;
    wins: number;
    totalGames: number;
    winRate: number;
    rank: number;
    potentialReward: number;
    isEligible: boolean;
  }>;
  rewardStructure: Record<number, number>;
  eligibilityRequirements: {
    minimumGames: number;
    topPlayersRewarded: number;
    resetPeriod: string;
  };
  stats: {
    totalEligiblePlayers: number;
    totalQualifiedPlayers: number;
    averageReward: number;
  };
}

export default function RewardsPage() {
  const { address } = useAuth();
  const [rewardData, setRewardData] = useState<RewardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState<any>(null);

  useEffect(() => {
    fetchRewardData();
  }, []);

  useEffect(() => {
    if (rewardData && address) {
      const userEntry = rewardData.leaderboard.find(entry => entry.address.toLowerCase() === address.toLowerCase());
      setUserPosition(userEntry);
    }
  }, [rewardData, address]);

  const fetchRewardData = async () => {
    try {
      const response = await fetch("/api/rewards/current");
      const result = await response.json();
      if (result.success) {
        setRewardData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch reward data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Loading reward information...</p>
        </div>
      </div>
    );
  }

  if (!rewardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-base-content/60">Failed to load reward information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Trophy className="text-yellow-500" size={40} />
          Monthly Rewards
        </h1>
        <p className="text-lg text-base-content/70">Compete for CELO rewards! Top 30 AI players earn monthly prizes.</p>
      </div>

      {/* Current Season Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card/50 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-primary" size={20} />
            <h3 className="font-semibold">Next Payout</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{rewardData.payout.timeUntilPayout}</p>
          <p className="text-sm text-base-content/60">Until monthly reset</p>
        </div>

        <div className="bg-card/50 rounded-xl p-4 border border-secondary/20">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="text-secondary" size={20} />
            <h3 className="font-semibold">Total Rewards</h3>
          </div>
          <p className="text-2xl font-bold text-secondary">{rewardData.payout.totalRewards} CELO</p>
          <p className="text-sm text-base-content/60">This month&apos;s pool</p>
        </div>

        <div className="bg-card/50 rounded-xl p-4 border border-accent/20">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-accent" size={20} />
            <h3 className="font-semibold">Eligible Players</h3>
          </div>
          <p className="text-2xl font-bold text-accent">{rewardData.stats.totalEligiblePlayers}</p>
          <p className="text-sm text-base-content/60">Out of {rewardData.stats.totalQualifiedPlayers} qualified</p>
        </div>

        <div className="bg-card/50 rounded-xl p-4 border border-info/20">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-info" size={20} />
            <h3 className="font-semibold">Min. Games</h3>
          </div>
          <p className="text-2xl font-bold text-info">{rewardData.eligibilityRequirements.minimumGames}</p>
          <p className="text-sm text-base-content/60">To qualify for rewards</p>
        </div>
      </div>

      {/* User Position (if connected) */}
      {address && userPosition && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 mb-8 border border-primary/30">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary" size={24} />
            Your Current Position
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-base-content/60">Rank</p>
              <p className="text-2xl font-bold text-primary">#{userPosition.rank}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/60">AI Wins</p>
              <p className="text-2xl font-bold">{userPosition.wins}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/60">Win Rate</p>
              <p className="text-2xl font-bold">{userPosition.winRate}%</p>
            </div>
            <div>
              <p className="text-sm text-base-content/60">Potential Reward</p>
              <p className="text-2xl font-bold text-secondary">
                {userPosition.isEligible ? `${userPosition.potentialReward} CELO` : "0 CELO"}
              </p>
            </div>
          </div>
          {!userPosition.isEligible && (
            <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/30">
              <p className="text-sm text-warning">
                {userPosition.rank > 30
                  ? `You need to reach top 30 to earn rewards (currently #${userPosition.rank})`
                  : `You need ${rewardData.eligibilityRequirements.minimumGames - userPosition.totalGames} more games to qualify`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-card/50 rounded-xl p-6 border border-border">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          Current Leaderboard & Rewards
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2">Rank</th>
                <th className="text-left py-3 px-2">Player</th>
                <th className="text-left py-3 px-2">Wins</th>
                <th className="text-left py-3 px-2">Games</th>
                <th className="text-left py-3 px-2">Win Rate</th>
                <th className="text-left py-3 px-2">Reward</th>
              </tr>
            </thead>
            <tbody>
              {rewardData.leaderboard.map(player => (
                <tr
                  key={player.address}
                  className={`border-b border-border/50 ${
                    address && player.address.toLowerCase() === address.toLowerCase() ? "bg-primary/10" : ""
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          player.rank === 1
                            ? "text-yellow-500"
                            : player.rank === 2
                              ? "text-gray-400"
                              : player.rank === 3
                                ? "text-orange-600"
                                : player.isEligible
                                  ? "text-primary"
                                  : "text-base-content/60"
                        }`}
                      >
                        #{player.rank}
                      </span>
                      {player.rank <= 3 && (
                        <Trophy
                          size={16}
                          className={
                            player.rank === 1
                              ? "text-yellow-500"
                              : player.rank === 2
                                ? "text-gray-400"
                                : "text-orange-600"
                          }
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-mono text-sm">
                      {player.address.slice(0, 6)}...{player.address.slice(-4)}
                    </span>
                    {address && player.address.toLowerCase() === address.toLowerCase() && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">You</span>
                    )}
                  </td>
                  <td className="py-3 px-2 font-semibold">{player.wins}</td>
                  <td className="py-3 px-2">{player.totalGames}</td>
                  <td className="py-3 px-2">{player.winRate}%</td>
                  <td className="py-3 px-2">
                    <span className={`font-bold ${player.isEligible ? "text-secondary" : "text-base-content/40"}`}>
                      {player.potentialReward} CELO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rewardData.leaderboard.length === 0 && (
          <div className="text-center py-8 text-base-content/60">
            <p>No qualified players yet. Play 5+ AI games to appear on the leaderboard!</p>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="mt-8 bg-card/30 rounded-xl p-6 border border-border">
        <h3 className="text-lg font-bold mb-4">How Rewards Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Eligibility</h4>
            <ul className="text-sm text-base-content/70 space-y-1">
              <li>• Play at least {rewardData.eligibilityRequirements.minimumGames} AI games</li>
              <li>• Rank in top {rewardData.eligibilityRequirements.topPlayersRewarded} players</li>
              <li>• Based on total AI wins</li>
              <li>• Resets weekly on Sundays</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Distribution</h4>
            <ul className="text-sm text-base-content/70 space-y-1">
              <li>• Automatic CELO payouts</li>
              <li>• Sent to your connected wallet</li>
              <li>• Every Sunday at midnight UTC</li>
              <li>• No claiming required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
