import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

const contract = deployedContracts[42220].RPSOnline;

export async function POST(req: NextRequest) {
  try {
    const { roomId, winner } = await req.json();

    const privateKey = process.env.BACKEND_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("BACKEND_PRIVATE_KEY not configured");
    }

    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: celo,
      transport: http(),
    });

    const hash = await client.writeContract({
      address: contract.address as `0x${string}`,
      abi: contract.abi,
      functionName: "finishGameAndPayout",
      args: [roomId, winner],
    });

    return NextResponse.json({ success: true, txHash: hash });
  } catch (error: any) {
    console.error("Error processing payout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
