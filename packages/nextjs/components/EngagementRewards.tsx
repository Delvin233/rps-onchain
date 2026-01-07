"use client";

import { useState } from "react";
import { Calendar, Gift, Share2, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { EngagementReward, EngagementStats } from "~~/hooks/useGoodDollarClaim";

interface EngagementRewardsProps {
  stats: EngagementStats | null;
  rewards: EngagementReward[];
  onShare: (platform: "twitter" | "telegram" | "farcaster") => Promise<any>;
  onClaimEngagement?: () => Promise<any>;
  isLoading?: boolean;
}

export const EngagementRewards = ({
  stats,
  rewards,
  onShare,
  onClaimEngagement,
  isLoading,
}: EngagementRewardsProps) => {
  const [showRewards, setShowRewards] = useState(false);

  const handleShare = async (platform: "twitter" | "telegram" | "farcaster") => {
    try {
      const result = await onShare(platform);
      if (result) {
        toast.success(result.message);
      }
    } catch {
      toast.error("Failed to process share reward");
    }
  };

  const getShareUrl = (platform: "twitter" | "telegram" | "farcaster") => {
    const text = `Just claimed my daily UBI from @gooddollar! 💚 Building a better economy for everyone. #UBI #GoodDollar #DeFi`;
    const url = window.location.origin;

    switch (platform) {
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      case "telegram":
        return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      case "farcaster":
        return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`;
      default:
        return "";
    }
  };

  const openShareWindow = (platform: "twitter" | "telegram" | "farcaster") => {
    const shareUrl = getShareUrl(platform);
    window.open(shareUrl, "_blank", "width=600,height=400");
    handleShare(platform);
  };

  if (!stats) return null;

  return (
    <div className="bg-card/50 rounded-xl p-6 mb-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Trophy className="text-yellow-500" size={24} />
          <div>
            <p className="font-semibold">Engagement Rewards</p>
            <p className="text-xs text-base-content/60">Earn bonus G$ for consistent participation</p>
          </div>
        </div>
        <button onClick={() => setShowRewards(!showRewards)} className="btn btn-sm btn-ghost">
          {showRewards ? "−" : "+"}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-base-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-primary" />
            <span className="text-xs text-base-content/60">Streak</span>
          </div>
          <p className="font-bold text-lg">{stats.consecutiveDays} days</p>
        </div>

        <div className="bg-base-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={16} className="text-success" />
            <span className="text-xs text-base-content/60">Total Claims</span>
          </div>
          <p className="font-bold text-lg">{stats.totalClaims}</p>
        </div>
      </div>

      {showRewards && (
        <div className="space-y-4">
          {/* Active Rewards */}
          {rewards.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-success">🎉 Active Rewards</h4>
              {rewards.map((reward, index) => (
                <div key={index} className="bg-success/10 border border-success/30 rounded-lg p-3 mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-success">{reward.description}</p>
                      <p className="text-xs text-base-content/60">
                        {reward.type === "consecutive_days" && `${reward.daysStreak} day streak`}
                      </p>
                    </div>
                    <span className="font-bold text-success">+{(Number(reward.amount) / 1e18).toFixed(1)} G$</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Engagement Status */}
          <div>
            <h4 className="font-semibold mb-2">🔗 Engagement Status</h4>
            <div className="space-y-2">
              <div
                className={`rounded-lg p-3 ${stats.isRegistered ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm">Registration Status</span>
                  <span className={`text-sm font-medium ${stats.isRegistered ? "text-success" : "text-warning"}`}>
                    {stats.isRegistered ? "✅ Registered" : "⚠️ Not Registered"}
                  </span>
                </div>
              </div>

              <div
                className={`rounded-lg p-3 ${stats.canClaimEngagement ? "bg-success/10 border border-success/30" : "bg-base-200"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm">Engagement Rewards</span>
                  <span
                    className={`text-sm font-medium ${stats.canClaimEngagement ? "text-success" : "text-base-content/60"}`}
                  >
                    {stats.canClaimEngagement ? "✅ Available" : "⏳ Not Available"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Rewards Claim Button */}
          {stats.canClaimEngagement && onClaimEngagement && (
            <div>
              <h4 className="font-semibold mb-2">🎁 Claim Engagement Rewards</h4>
              <button
                onClick={async () => {
                  try {
                    await onClaimEngagement();
                    toast.success("Engagement rewards claimed successfully!");
                  } catch {
                    toast.error("Failed to claim engagement rewards");
                  }
                }}
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? "Claiming..." : "Claim Engagement Rewards"}
              </button>
              <p className="text-xs text-base-content/60 mt-2">
                Additional rewards for your engagement with the Good Dollar ecosystem
              </p>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">📅 Streak Progress</h4>
            <div className="bg-base-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Weekly Bonus Progress</span>
                <span className="text-sm font-medium">{stats.consecutiveDays % 7}/7 days</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((stats.consecutiveDays % 7) / 7) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                {7 - (stats.consecutiveDays % 7)} more days for +5 G$ bonus
              </p>
            </div>
          </div>

          {/* Milestone Progress */}
          <div>
            <h4 className="font-semibold mb-2">🏆 Milestones</h4>
            <div className="space-y-2">
              <div
                className={`rounded-lg p-3 ${stats.totalClaims >= 10 ? "bg-success/10 border border-success/30" : "bg-base-200"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm">10 Claims Milestone</span>
                  <span
                    className={`text-sm font-medium ${stats.totalClaims >= 10 ? "text-success" : "text-base-content/60"}`}
                  >
                    {stats.totalClaims >= 10 ? "✅ +50 G$" : `${stats.totalClaims}/10`}
                  </span>
                </div>
              </div>

              <div
                className={`rounded-lg p-3 ${stats.totalClaims >= 30 ? "bg-success/10 border border-success/30" : "bg-base-200"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm">30 Claims Milestone</span>
                  <span
                    className={`text-sm font-medium ${stats.totalClaims >= 30 ? "text-success" : "text-base-content/60"}`}
                  >
                    {stats.totalClaims >= 30 ? "✅ +100 G$" : `${stats.totalClaims}/30`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Sharing */}
          <div>
            <h4 className="font-semibold mb-2">📢 Share & Earn</h4>
            <p className="text-xs text-base-content/60 mb-3">Share your UBI claim and earn +1 G$ per platform</p>
            <div className="flex gap-2">
              <button
                onClick={() => openShareWindow("twitter")}
                className="btn btn-sm flex-1"
                style={{ backgroundColor: "#1DA1F2", color: "white" }}
              >
                <Share2 size={16} />
                Twitter
              </button>
              <button
                onClick={() => openShareWindow("farcaster")}
                className="btn btn-sm flex-1"
                style={{ backgroundColor: "#8A63D2", color: "white" }}
              >
                <Share2 size={16} />
                Farcaster
              </button>
              <button
                onClick={() => openShareWindow("telegram")}
                className="btn btn-sm flex-1"
                style={{ backgroundColor: "#0088CC", color: "white" }}
              >
                <Share2 size={16} />
                Telegram
              </button>
            </div>
            <p className="text-xs text-base-content/60 mt-2">Shares this session: {stats.socialShares}</p>
          </div>

          {/* Total Rewards Earned */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-base-content/60 mb-1">Total Rewards Earned</p>
              <p className="font-bold text-2xl text-primary">
                {(Number(stats.totalRewardsEarned) / 1e18).toFixed(2)} G$
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
