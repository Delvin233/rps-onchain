const DIVVI_CONSUMER_ADDRESS = "0x4298D42Cf8a15B88Ee7d9CD36aD3686F9B9FD5F6";

export async function getDivviReferralTag(userAddress: string): Promise<`0x${string}` | ""> {
  try {
    const sdk = (await import("@divvi/referral-sdk")) as any;
    const tag = sdk.getReferralTag({
      user: userAddress,
      consumer: DIVVI_CONSUMER_ADDRESS,
    });
    console.log("Generated Divvi referral tag (raw):", tag);
    // Ensure proper 0x prefix for dataSuffix
    const formattedTag = tag.startsWith("0x") ? tag : `0x${tag}`;
    console.log("Generated Divvi referral tag (formatted):", formattedTag);
    return formattedTag as `0x${string}`;
  } catch (error) {
    console.warn("Failed to generate Divvi referral tag:", error);
    return "";
  }
}

export async function submitDivviReferral(txHash: string, chainId: number): Promise<void> {
  try {
    const sdk = (await import("@divvi/referral-sdk")) as any;
    const response = await sdk.submitReferral({
      txHash,
      chainId,
    });
    console.log("Divvi referral submitted successfully:", response);
  } catch (error) {
    console.warn("Failed to submit Divvi referral:", error);
  }
}
