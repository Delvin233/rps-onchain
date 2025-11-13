import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base, celo } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const chainId = searchParams.get("chainId");

  if (!roomId || !chainId) {
    return NextResponse.json({ error: "Missing roomId or chainId" }, { status: 400 });
  }

  const chain = chainId === "42220" ? celo : base;
  const client = createPublicClient({ chain, transport: http() });
  const contract = deployedContracts[parseInt(chainId) as 42220 | 8453].RPSOnline;

  try {
    const matches = (await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getMatchHistory",
      args: [roomId],
    })) as any[];

    const [, player1, player2] = (await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getRoomStats",
      args: [roomId],
    })) as [bigint, string, string];

    return NextResponse.json({
      matches: matches.map(m => ({
        winner: m.winner,
        player1Move: m.player1Move,
        player2Move: m.player2Move,
        timestamp: Number(m.timestamp),
      })),
      players: { player1, player2 },
    });
  } catch (error) {
    console.error("Error fetching blockchain match:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
