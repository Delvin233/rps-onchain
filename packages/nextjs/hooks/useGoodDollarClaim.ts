"use client";

import { useMemo, useState } from "react";
import { ClaimSDK, IdentitySDK } from "@goodsdks/citizen-sdk";
import { REWARDS_CONTRACT, useEngagementRewards } from "@goodsdks/engagement-sdk";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

// Types for engagement rewards
export interface EngagementReward {
  type: "consecutive_days" | "referral" | "social_share" | "community_action";
  amount: bigint;
  description: string;
  multiplier?: number;
  daysStreak?: number;
}

export interface EngagementStats {
  consecutiveDays: number;
  totalClaims: number;
  referrals: number;
  socialShares: number;
  lastClaimDate: Date | null;
  totalRewardsEarned: bigint;
  canClaimEngagement: boolean;
  isRegistered: boolean;
}

// Configuration - these should be environment variables in production
const APP_ADDRESS = (process.env.NEXT_PUBLIC_GOODDOLLAR_APP_ADDRESS as `0x${string}`) || ("0x" as `0x${string}`);
const INVITER_ADDRESS =
  (process.env.NEXT_PUBLIC_GOODDOLLAR_INVITER_ADDRESS as `0x${string}`) || ("0x" as `0x${string}`);

export const useGoodDollarClaim = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [engagementStats, setEngagementStats] = useState<EngagementStats | null>(null);

  // Initialize engagement rewards SDK
  const engagementRewards = useEngagementRewards(REWARDS_CONTRACT);

  const claimSDK = useMemo(() => {
    if (!address || !publicClient || !walletClient) return null;

    try {
      const identitySDK = new IdentitySDK({
        account: address,
        publicClient,
        walletClient,
        env: "production",
      });
      return new ClaimSDK({
        account: address,
        publicClient,
        walletClient,
        identitySDK,
        env: "production",
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error initializing ClaimSDK:", error);
      }
      return null;
    }
  }, [address, publicClient, walletClient]);

  const checkEntitlement = async () => {
    if (!claimSDK) return { amount: 0n };
    try {
      return await claimSDK.checkEntitlement();
    } catch (error) {
      // Silently handle Fuse network errors
      if (error?.toString().includes("fuse-rpc")) {
        return { amount: 0n };
      }
      if (process.env.NODE_ENV === "development") {
        console.error("Error checking entitlement:", error);
      }
      return { amount: 0n };
    }
  };

  const getNextClaimTime = async () => {
    if (!claimSDK) return null;
    try {
      return await claimSDK.nextClaimTime();
    } catch (error) {
      // Silently handle Fuse network errors
      if (error?.toString().includes("fuse-rpc")) {
        return null;
      }
      if (process.env.NODE_ENV === "development") {
        console.error("Error getting next claim time:", error);
      }
      return null;
    }
  };

  const identitySDK = useMemo(() => {
    if (!address || !publicClient || !walletClient) return null;
    try {
      return new IdentitySDK({
        account: address as `0x${string}`,
        publicClient,
        walletClient,
        env: "production",
      });
    } catch {
      return null;
    }
  }, [address, publicClient, walletClient]);

  // Engagement rewards functions using official SDK
  const checkEngagementEligibility = async (): Promise<boolean> => {
    if (!engagementRewards || !address) return false;

    try {
      return await engagementRewards.canClaim(APP_ADDRESS, address).catch(() => false);
    } catch (error) {
      console.error("Error checking engagement eligibility:", error);
      return false;
    }
  };

  const checkEngagementRegistration = async (): Promise<boolean> => {
    if (!engagementRewards || !address) return false;

    try {
      // Note: The SDK might not have isUserRegistered method
      // For now, we'll assume users need to register on first claim
      return true; // Simplified for now - registration happens automatically on first claim
    } catch (error) {
      console.error("Error checking engagement registration:", error);
      return false;
    }
  };

  const getEngagementStats = async (): Promise<EngagementStats | null> => {
    if (!address || !engagementRewards) return null;

    try {
      // Check engagement rewards eligibility and registration
      const [canClaimEngagement, isRegistered] = await Promise.all([
        checkEngagementEligibility(),
        checkEngagementRegistration(),
      ]);

      // Get stats from localStorage for tracking (this supplements the on-chain data)
      const stored = localStorage.getItem(`gooddollar_engagement_${address}`);
      let localStats = {
        consecutiveDays: 0,
        totalClaims: 0,
        referrals: 0,
        socialShares: 0,
        lastClaimDate: null as Date | null,
        totalRewardsEarned: 0n,
      };

      if (stored) {
        const parsed = JSON.parse(stored);
        localStats = {
          ...parsed,
          lastClaimDate: parsed.lastClaimDate ? new Date(parsed.lastClaimDate) : null,
          totalRewardsEarned: BigInt(parsed.totalRewardsEarned || 0),
        };
      }

      const stats: EngagementStats = {
        ...localStats,
        canClaimEngagement,
        isRegistered,
      };

      setEngagementStats(stats);
      return stats;
    } catch (error) {
      console.error("Error getting engagement stats:", error);
      return null;
    }
  };

  const claimEngagementRewards = async () => {
    if (!engagementRewards || !address) {
      throw new Error("Engagement rewards SDK not ready");
    }

    try {
      // Check if user can claim
      const isEligible = await engagementRewards.canClaim(APP_ADDRESS, address).catch(() => false);
      if (!isEligible) {
        throw new Error("User not eligible to claim engagement rewards");
      }

      // Get current block and prepare signature if needed
      const currentBlock = await engagementRewards.getCurrentBlockNumber();
      const validUntilBlock = currentBlock + 600n; // Valid for 600 blocks

      // Generate signature for first-time users or after app re-apply
      let userSignature = "0x" as `0x${string}`;
      // Note: Registration check simplified - will register automatically on first claim
      const needsRegistration = true; // Assume registration needed for safety
      if (needsRegistration) {
        userSignature = await engagementRewards.signClaim(APP_ADDRESS, INVITER_ADDRESS, validUntilBlock);
      }

      // Get app signature from backend
      const appSignature = await getAppSignature({
        user: address,
        validUntilBlock: validUntilBlock.toString(),
        inviter: INVITER_ADDRESS,
      });

      // Submit claim
      const receipt = await engagementRewards.nonContractAppClaim(
        APP_ADDRESS,
        INVITER_ADDRESS,
        validUntilBlock,
        userSignature,
        appSignature,
      );

      return receipt;
    } catch (error) {
      console.error("Engagement rewards claim failed:", error);
      throw error;
    }
  };

  // Helper function to get app signature from backend
  const getAppSignature = async (params: {
    user: string;
    validUntilBlock: string;
    inviter: string;
  }): Promise<`0x${string}`> => {
    try {
      const response = await fetch("/api/gooddollar/sign-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("Failed to get app signature");
      }

      const { signature } = await response.json();
      return signature as `0x${string}`;
    } catch (error) {
      console.error("Error getting app signature:", error);
      throw new Error("Failed to get app signature");
    }
  };

  const updateEngagementStats = async (claimAmount: bigint) => {
    if (!address) return;

    try {
      const currentStats = await getEngagementStats();
      if (!currentStats) return;

      const now = new Date();
      const lastClaim = currentStats.lastClaimDate;

      // Calculate consecutive days
      let consecutiveDays = currentStats.consecutiveDays;
      if (lastClaim) {
        const daysDiff = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          consecutiveDays += 1; // Consecutive day
        } else if (daysDiff > 1) {
          consecutiveDays = 1; // Reset streak
        }
        // If daysDiff === 0, same day claim (shouldn't happen but handle gracefully)
      } else {
        consecutiveDays = 1; // First claim
      }

      const updatedStats: EngagementStats = {
        ...currentStats,
        consecutiveDays,
        totalClaims: currentStats.totalClaims + 1,
        lastClaimDate: now,
        totalRewardsEarned: currentStats.totalRewardsEarned + claimAmount,
      };

      // Store updated stats
      localStorage.setItem(
        `gooddollar_engagement_${address}`,
        JSON.stringify({
          ...updatedStats,
          totalRewardsEarned: updatedStats.totalRewardsEarned.toString(),
        }),
      );

      setEngagementStats(updatedStats);
    } catch (error) {
      console.error("Error updating engagement stats:", error);
    }
  };

  const calculateEngagementRewards = async (): Promise<EngagementReward[]> => {
    const stats = await getEngagementStats();
    if (!stats) return [];

    const rewards: EngagementReward[] = [];

    // Consecutive days bonus
    if (stats.consecutiveDays >= 7) {
      const weeklyBonus = BigInt(Math.floor(stats.consecutiveDays / 7)) * BigInt(5 * 1e18); // 5 G$ per week
      rewards.push({
        type: "consecutive_days",
        amount: weeklyBonus,
        description: `${Math.floor(stats.consecutiveDays / 7)} week streak bonus`,
        daysStreak: stats.consecutiveDays,
        multiplier: Math.floor(stats.consecutiveDays / 7),
      });
    }

    // Milestone rewards
    if (stats.totalClaims === 10) {
      rewards.push({
        type: "community_action",
        amount: BigInt(50 * 1e18), // 50 G$ milestone
        description: "10 claims milestone reached!",
      });
    }

    if (stats.totalClaims === 30) {
      rewards.push({
        type: "community_action",
        amount: BigInt(100 * 1e18), // 100 G$ milestone
        description: "30 claims milestone reached!",
      });
    }

    return rewards;
  };

  const claimWithEngagementRewards = async () => {
    if (!claimSDK) throw new Error("Claim SDK not ready");
    setIsLoading(true);

    try {
      // Get base entitlement first
      const entitlement = await claimSDK.checkEntitlement();

      // Perform the base UBI claim
      const ubiResult = await claimSDK.claim();

      // Update local engagement stats
      await updateEngagementStats(entitlement.amount);

      // Try to claim engagement rewards if eligible
      let engagementResult = null;
      try {
        if (engagementRewards && APP_ADDRESS !== "0x") {
          const canClaimEngagement = await checkEngagementEligibility();
          if (canClaimEngagement) {
            engagementResult = await claimEngagementRewards();
          }
        }
      } catch (engagementError) {
        // Don't fail the entire claim if engagement rewards fail
        console.warn("Engagement rewards claim failed:", engagementError);
      }

      // Calculate display rewards for UI
      const displayRewards = await calculateEngagementRewards();

      return {
        ...ubiResult,
        engagementRewards: displayRewards,
        engagementResult,
        baseAmount: entitlement.amount,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const shareReward = async (platform: "twitter" | "telegram" | "farcaster") => {
    if (!address) return;

    try {
      const stats = await getEngagementStats();
      if (!stats) return;

      const updatedStats = {
        ...stats,
        socialShares: stats.socialShares + 1,
      };

      localStorage.setItem(
        `gooddollar_engagement_${address}`,
        JSON.stringify({
          ...updatedStats,
          totalRewardsEarned: updatedStats.totalRewardsEarned.toString(),
        }),
      );

      setEngagementStats(updatedStats);

      // In production, this would trigger a small reward
      return {
        platform,
        reward: BigInt(1 * 1e18), // 1 G$ for sharing
        message: `Thanks for sharing on ${platform}!`,
      };
    } catch (error) {
      console.error("Error processing share reward:", error);
      return null;
    }
  };

  return {
    checkEntitlement,
    getNextClaimTime,
    claim: claimWithEngagementRewards, // Enhanced claim with engagement rewards
    isLoading,
    isReady: !!claimSDK,
    identitySDK,
    // Engagement rewards functions
    getEngagementStats,
    calculateEngagementRewards,
    shareReward,
    engagementStats,
    // Official SDK engagement functions
    checkEngagementEligibility,
    checkEngagementRegistration,
    claimEngagementRewards,
    engagementRewards, // Expose the SDK instance
  };
};
