import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

const contract = deployedContracts[42220].RPSOnline;

export async function POST(req: NextRequest) {
  try {
    const { roomId } = await req.json();

    const account = privateKeyToAccount(process.env.BACKEND_PRIVATE_KEY as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: celo,
      transport: http(),
    });

    const hash = await client.writeContract({
      address: contract.address as `0x${string}`,
      abi: contract.abi,
      functionName: "refundExpiredGame" as any,
      args: [roomId],
    });

    return NextResponse.json({ success: true, txHash: hash });
  } catch (error: any) {
    console.error("Error refunding expired game:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
