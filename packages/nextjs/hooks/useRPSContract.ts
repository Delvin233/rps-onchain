"use client";

import { useCallback, useEffect, useState } from "react";
import { Address, parseAbi } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { getBaseUrl } from "~~/utils/shareUtils";

// Contract ABI for the verification functions we need (simplified)
const RPS_CONTRACT_ABI = parseAbi([
  "function isUserVerified(address user) external view returns (bool)",
  "event UserVerified(address indexed user, bytes32 indexed nullifier)",
]);

// Contract address (deployed on Celo Mainnet)
const CONTRACT_ADDRESS: Address = "0x3e5e80bc7de408f9d63963501179a50b251cbda3";

export const useRPSContract = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isVerified, setIsVerified] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check verification status with blockchain-first, Turso fallback approach
  const checkVerificationStatus = useCallback(async () => {
    if (!address) return false;

    try {
      setIsLoading(true);

      // Try blockchain first (source of truth)
      if (publicClient) {
        try {
          console.log(`[Verification] Checking blockchain for ${address}...`);
          const verified = (await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: RPS_CONTRACT_ABI,
            functionName: "isUserVerified",
            args: [address],
          })) as boolean;

          setIsVerified(verified);

          if (verified) {
            // For now, just store basic verification status
            setVerificationData({ verified: true, source: "blockchain" });

            // Sync to Turso for future fast access (non-blocking)
            fetch(`${getBaseUrl()}/api/sync-verification`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address,
                verified,
                verificationData: { verified: true, source: "blockchain" },
              }),
            })
              .then(response => {
                if (response.ok) {
                  console.log("[Sync] Successfully synced to Turso");
                } else {
                  console.warn("[Sync] Turso sync failed with status:", response.status);
                }
              })
              .catch(err => console.warn("[Sync] Failed to sync to Turso:", err));
          }

          console.log(`[Verification] Blockchain result: ${verified}`);
          return verified;
        } catch (blockchainError) {
          console.warn(`[Verification] Blockchain failed, trying Turso fallback:`, blockchainError);

          // Fallback to Turso if blockchain fails (RPC issues, rate limits, etc.)
          try {
            const response = await fetch(`${getBaseUrl()}/api/sync-verification?address=${address}`);
            const tursoResult = await response.json();

            if (tursoResult.verified) {
              setIsVerified(true);
              setVerificationData(tursoResult.verificationData);
              console.log(`[Verification] Turso fallback result: verified`);
              return true;
            } else {
              setIsVerified(false);
              setVerificationData(null);
              console.log(`[Verification] Turso fallback result: not verified`);
              return false;
            }
          } catch (tursoError) {
            console.error(`[Verification] Both blockchain and Turso failed:`, tursoError);
            setIsVerified(false);
            setVerificationData(null);
            return false;
          }
        }
      } else {
        // No publicClient available, use Turso only
        console.log(`[Verification] No RPC client, using Turso only for ${address}...`);
        const response = await fetch(`${getBaseUrl()}/api/sync-verification?address=${address}`);
        const tursoResult = await response.json();

        setIsVerified(tursoResult.verified || false);
        setVerificationData(tursoResult.verificationData || null);
        console.log(`[Verification] Turso-only result: ${tursoResult.verified}`);
        return tursoResult.verified || false;
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setIsVerified(false);
      setVerificationData(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  // Watch for UserVerified events for the current user
  const watchVerificationEvents = useCallback(() => {
    if (!address || !publicClient) return;

    const unwatch = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: RPS_CONTRACT_ABI,
      eventName: "UserVerified",
      args: {
        user: address,
      },
      onLogs: logs => {
        console.log("UserVerified event detected:", logs);
        // Refresh verification status when event is detected
        checkVerificationStatus();
      },
    });

    return unwatch;
  }, [address, publicClient, checkVerificationStatus]);

  // Check verification status when address changes
  useEffect(() => {
    if (address) {
      checkVerificationStatus();
    } else {
      setIsVerified(false);
      setVerificationData(null);
    }
  }, [address, checkVerificationStatus]);

  // Start watching for events when component mounts
  useEffect(() => {
    const unwatch = watchVerificationEvents();
    return unwatch;
  }, [watchVerificationEvents]);

  return {
    isVerified,
    verificationData,
    isLoading,
    checkVerificationStatus,
    contractAddress: CONTRACT_ADDRESS,
  };
};
