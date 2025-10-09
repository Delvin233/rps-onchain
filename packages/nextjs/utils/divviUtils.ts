import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

const DIVVI_CONSUMER_ADDRESS = '0x4298D42Cf8a15B88Ee7d9CD36aD3686F9B9FD5F6';

export function getDivviReferralTag(userAddress: string): string {
  try {
    return getReferralTag({
      user: userAddress,
      consumer: DIVVI_CONSUMER_ADDRESS,
    });
  } catch (error) {
    console.warn('Failed to generate Divvi referral tag:', error);
    return '';
  }
}

export async function submitDivviReferral(txHash: string, chainId: number): Promise<void> {
  try {
    await submitReferral({
      txHash,
      chainId,
    });
    console.log('Divvi referral submitted successfully');
  } catch (error) {
    console.warn('Failed to submit Divvi referral:', error);
  }
}