"use client";

import { useEffect, useMemo, useState } from "react";
import { ClaimSDK, IdentitySDK } from "@goodsdks/citizen-sdk";
import { REWARDS_CONTRACT, useEngagementRewards } from "@goodsdks/engagement-sdk";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { cleanReferralFromUrl, getReferrerFromUrl } from "~~/utils/referralUtils";

// Configuration - these should be environment variables in production
const APP_ADDRESS = (process.env.NEXT_PUBLIC_GOODDOLLAR_APP_ADDRESS as `0x${string}`) || ("0x" as `0x${string}`);
const INVITER_ADDRESS =
  (process.env.NEXT_PUBLIC_GOODDOLLAR_INVITER_ADDRESS as `0x${string}`) || ("0x" as `0x${string}`);

export const useGoodDollarClaim = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);

  // Initialize engagement rewards SDK
  const engagementRewards = useEngagementRewards(REWARDS_CONTRACT);

  // Detect referral on component mount
  useEffect(() => {
    const referrer = getReferrerFromUrl();
    if (referrer && referrer !== address) {
      setReferrerAddress(referrer);
      // Store referrer for later use in claims
      if (address) {
        localStorage.setItem(`gooddollar_referrer_${address}`, referrer);
      }
      // Clean URL after processing
      cleanReferralFromUrl();
    }
  }, [address]);

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

  // Check if user can claim engagement rewards
  const checkEngagementEligibility = async (): Promise<boolean> => {
    if (!engagementRewards || !address) return false;

    try {
      return await engagementRewards.canClaim(APP_ADDRESS, address).catch(() => false);
    } catch (error) {
      console.error("Error checking engagement eligibility:", error);
      return false;
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

      // Determine inviter address - use detected referrer or default
      const storedReferrer = localStorage.getItem(`gooddollar_referrer_${address}`);
      const inviterToUse = referrerAddress || storedReferrer || INVITER_ADDRESS;

      // Generate signature for first-time users or after app re-apply
      let userSignature = "0x" as `0x${string}`;
      const needsRegistration = true; // Assume registration needed for safety
      if (needsRegistration) {
        userSignature = await engagementRewards.signClaim(APP_ADDRESS, inviterToUse, validUntilBlock);
      }

      // Get app signature from backend
      const appSignature = await getAppSignature({
        user: address,
        validUntilBlock: validUntilBlock.toString(),
        inviter: inviterToUse,
      });

      // Submit claim
      const receipt = await engagementRewards.nonContractAppClaim(
        APP_ADDRESS,
        inviterToUse,
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

  const claimWithEngagementRewards = async () => {
    if (!claimSDK) throw new Error("Claim SDK not ready");
    setIsLoading(true);

    try {
      // Get base entitlement first
      const entitlement = await claimSDK.checkEntitlement();

      // Perform the base UBI claim
      const ubiResult = await claimSDK.claim();

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

      return {
        ...ubiResult,
        engagementResult,
        baseAmount: entitlement.amount,
      };
    } finally {
      setIsLoading(false);
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
    checkEngagementEligibility,
    claimEngagementRewards,
    engagementRewards, // Expose the SDK instance
  };
};
