import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

const contract = deployedContracts[42220].RPSOnline;

export async function POST(req: NextRequest) {
  try {
    const { roomId, winner } = await req.json();
    console.log(`[PAYOUT] Processing payout for room ${roomId}, winner: ${winner}`);

    const privateKey = process.env.BACKEND_PRIVATE_KEY;
    if (!privateKey) {
      console.error("[PAYOUT] BACKEND_PRIVATE_KEY not configured");
      throw new Error("BACKEND_PRIVATE_KEY not configured");
    }

    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: celo,
      transport: http(),
    });

    console.log(`[PAYOUT] Sending transaction to contract...`);
    const hash = await client.writeContract({
      address: contract.address as `0x${string}`,
      abi: contract.abi,
      functionName: "finishGameAndPayout",
      args: [roomId, winner],
    });

    console.log(`[PAYOUT] Transaction sent: ${hash}`);
    return NextResponse.json({ success: true, txHash: hash });
  } catch (error: any) {
    console.error("Error processing payout:", error);

    // If transaction already known, it's processing - return success
    if (error.message?.includes("already known") || error.message?.includes("nonce")) {
      return NextResponse.json({ success: true, message: "Payout already processing" });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
