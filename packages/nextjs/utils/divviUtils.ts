const DIVVI_CONSUMER_ADDRESS = "0x4298D42Cf8a15B88Ee7d9CD36aD3686F9B9FD5F6";

export async function getDivviReferralTag(userAddress: string): Promise<string> {
  // Temporarily disabled for build
  console.log('Divvi referral disabled for:', userAddress);
  return '';
}

export async function submitDivviReferral(txHash: string, chainId: number): Promise<void> {
  // Temporarily disabled for build
  console.log('Divvi referral disabled for:', txHash, chainId);
}
