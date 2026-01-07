import { NextRequest, NextResponse } from "next/server";
import { EngagementRewardsSDK } from "@goodsdks/engagement-sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

// App configuration - these should be in environment variables
const APP_PRIVATE_KEY = process.env.GOODDOLLAR_APP_PRIVATE_KEY as `0x${string}`;
const APP_ADDRESS = process.env.NEXT_PUBLIC_GOODDOLLAR_APP_ADDRESS as `0x${string}`;
const REWARDS_CONTRACT = process.env.GOODDOLLAR_REWARDS_CONTRACT as `0x${string}`;

// Validate environment variables
if (!APP_PRIVATE_KEY) {
  console.error("GOODDOLLAR_APP_PRIVATE_KEY environment variable is required");
}
if (!APP_ADDRESS) {
  console.error("NEXT_PUBLIC_GOODDOLLAR_APP_ADDRESS environment variable is required");
}
if (!REWARDS_CONTRACT) {
  console.error("GOODDOLLAR_REWARDS_CONTRACT environment variable is required");
}

export async function POST(request: NextRequest) {
  try {
    if (!APP_PRIVATE_KEY || !REWARDS_CONTRACT || !APP_ADDRESS) {
      return NextResponse.json(
        { error: "Engagement rewards not configured. Check environment variables." },
        { status: 500 },
      );
    }

    const { user, validUntilBlock } = await request.json();

    if (!user || !validUntilBlock) {
      return NextResponse.json({ error: "Missing required parameters: user, validUntilBlock" }, { status: 400 });
    }

    // Basic validation
    if (!user.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ error: "Invalid user address format" }, { status: 400 });
    }

    // Rate limiting could be implemented here
    // For now, we'll just log the request
    console.log(`Signing claim for user: ${user}, validUntilBlock: ${validUntilBlock}`);

    // Initialize clients for this request to avoid type conflicts
    const account = privateKeyToAccount(APP_PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: celo,
      transport: http(),
    });
    const walletClient = createWalletClient({
      chain: celo,
      transport: http(),
      account,
    });

    // Initialize SDK for this request
    // @ts-ignore - Viem type compatibility issue between versions
    const engagementRewards = new EngagementRewardsSDK(publicClient, walletClient, REWARDS_CONTRACT);

    // Use SDK to prepare signature data
    const { domain, types, message } = await engagementRewards.prepareAppSignature(
      APP_ADDRESS,
      user as `0x${string}`,
      BigInt(validUntilBlock),
    );

    // Sign the prepared data
    const signature = await walletClient.signTypedData({
      domain,
      types,
      primaryType: "AppClaim",
      message,
    });

    // Log signature request for auditing (in production, use proper logging)
    console.log(`Signature generated for user ${user} at block ${validUntilBlock}`);

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Error signing engagement rewards claim:", error);
    return NextResponse.json(
      { error: "Failed to sign message", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
