import { NextRequest, NextResponse } from "next/server";

// GoodDollar token on Celo Mainnet
const GOODDOLLAR_ADDRESS = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A";

export async function POST(req: NextRequest) {
  try {
    const { from, to, amount } = await req.json();

    if (!from || !to || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Return token info for frontend to execute transfer
    return NextResponse.json({
      tokenAddress: GOODDOLLAR_ADDRESS,
      to,
      amount,
    });
  } catch (error: any) {
    console.error("Tip error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
