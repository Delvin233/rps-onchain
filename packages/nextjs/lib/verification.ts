/**
 * Verification utilities for hybrid blockchain + Turso approach
 */
import { createPublicClient, http, parseAbi } from "viem";
import { celo } from "viem/chains";
import { getBaseUrl } from "~~/utils/shareUtils";

const CONTRACT_ADDRESS = "0x3e5e80bc7de408f9d63963501179a50b251cbda3";
const CONTRACT_ABI = parseAbi(["function isUserVerified(address user) external view returns (bool)"]);

/**
 * Check verification status with blockchain-first, Turso fallback approach
 * This is a standalone utility that doesn't require React hooks
 */
export async function checkVerificationStatus(address: string): Promise<{
  verified: boolean;
  source: "blockchain" | "turso" | "none";
  error?: string;
}> {
  if (!address) {
    return { verified: false, source: "none", error: "No address provided" };
  }

  try {
    // Try blockchain first (source of truth)
    const client = createPublicClient({
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    try {
      console.log(`[Verification] Checking blockchain for ${address}...`);
      const verified = (await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "isUserVerified",
        args: [address as `0x${string}`],
      })) as boolean;

      console.log(`[Verification] Blockchain result: ${verified}`);

      // If verified on blockchain, sync to Turso for future fast access
      if (verified) {
        try {
          await fetch(`${getBaseUrl()}/api/sync-verification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address,
              verified: true,
              verificationData: { source: "blockchain_sync" },
            }),
          });
        } catch (syncError) {
          console.warn("[Sync] Failed to sync to Turso:", syncError);
        }
      }

      return { verified, source: "blockchain" };
    } catch (blockchainError) {
      console.warn(`[Verification] Blockchain failed, trying Turso fallback:`, blockchainError);

      // Fallback to Turso if blockchain fails (RPC issues, rate limits, etc.)
      try {
        const response = await fetch(`${getBaseUrl()}/api/sync-verification?address=${address}`);
        const tursoResult = await response.json();

        console.log(`[Verification] Turso fallback result: ${tursoResult.verified}`);
        return {
          verified: tursoResult.verified || false,
          source: "turso",
          error: tursoResult.error,
        };
      } catch (tursoError) {
        console.error(`[Verification] Both blockchain and Turso failed:`, tursoError);
        const blockchainMsg = blockchainError instanceof Error ? blockchainError.message : "Unknown blockchain error";
        const tursoMsg = tursoError instanceof Error ? tursoError.message : "Unknown Turso error";
        return {
          verified: false,
          source: "none",
          error: `Blockchain: ${blockchainMsg}, Turso: ${tursoMsg}`,
        };
      }
    }
  } catch (error) {
    console.error("Error in verification check:", error);
    return {
      verified: false,
      source: "none",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync verification status to Turso database
 */
export async function syncVerificationToTurso(
  address: string,
  verified: boolean,
  verificationData?: any,
  txHash?: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/sync-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        verified,
        verificationData,
        txHash,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[Sync] Successfully synced verification for ${address}: ${verified}`);
    return true;
  } catch (error) {
    console.error(`[Sync] Failed to sync verification for ${address}:`, error);
    return false;
  }
}
