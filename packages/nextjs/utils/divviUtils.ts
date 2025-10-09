const DIVVI_CONSUMER_ADDRESS = "0x4298D42Cf8a15B88Ee7d9CD36aD3686F9B9FD5F6";

// Temporary mock implementation for deployment
export function getDivviReferralTag(userAddress: string): string {
  console.log("Divvi referral tag generated for:", userAddress);
  return "";
}

export async function submitDivviReferral(txHash: string, chainId: number): Promise<void> {
  console.log("Divvi referral logged:", { txHash, chainId, consumer: DIVVI_CONSUMER_ADDRESS });
}
