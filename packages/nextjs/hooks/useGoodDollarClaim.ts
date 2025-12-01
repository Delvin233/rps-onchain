"use client";

import { useMemo, useState } from "react";
import { ClaimSDK, IdentitySDK } from "@goodsdks/citizen-sdk";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

export const useGoodDollarClaim = (claimAddress?: string) => {
  const { address: walletAddress, connector } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);

  // Use provided address (e.g., Farcaster address) or fall back to wallet address
  const address = (claimAddress || walletAddress) as `0x${string}` | undefined;

  // Check if we're in Farcaster and log wallet client status
  const isFarcaster = connector?.id === "farcasterMiniApp" || connector?.name?.toLowerCase().includes("farcaster");

  if (isFarcaster && address) {
    console.log("[GoodDollar] Farcaster connector detected:", {
      hasWalletClient: !!walletClient,
      connectorId: connector?.id,
      address,
    });
  }

  const claimSDK = useMemo(() => {
    if (!address || !publicClient || !walletClient) {
      if (isFarcaster && address && publicClient) {
        console.warn("[GoodDollar] Missing walletClient in Farcaster context - SDK will not work properly");
      }
      return null;
    }

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
      console.error("Error initializing ClaimSDK:", error);
      return null;
    }
  }, [address, publicClient, walletClient, isFarcaster]);

  const checkEntitlement = async () => {
    if (!claimSDK) return { amount: 0n };
    try {
      return await claimSDK.checkEntitlement();
    } catch (error) {
      // Silently handle Fuse network errors
      if (error?.toString().includes("fuse-rpc")) {
        return { amount: 0n };
      }
      console.error("Error checking entitlement:", error);
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
      console.error("Error getting next claim time:", error);
      return null;
    }
  };

  const claim = async () => {
    if (!claimSDK) throw new Error("Claim SDK not ready");
    setIsLoading(true);
    try {
      const result = await claimSDK.claim();
      return result;
    } finally {
      setIsLoading(false);
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

  return {
    checkEntitlement,
    getNextClaimTime,
    claim,
    isLoading,
    isReady: !!claimSDK,
    identitySDK,
  };
};
