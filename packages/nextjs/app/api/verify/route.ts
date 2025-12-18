import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: This API route is no longer used.
 *
 * We have migrated from backend verification to onchain verification using
 * the deployed smart contract at: 0x3E5e80BC7DE408F9D63963501179a50b251cBDa3
 *
 * The Self Protocol now verifies proofs directly on the Celo blockchain
 * through the RPSProofOfHuman contract, eliminating the need for backend
 * verification endpoints.
 *
 * Frontend configuration has been updated to use:
 * - endpointType: "celo"
 * - endpoint: "0x3e5e80bc7de408f9d63963501179a50b251cbda3"
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    status: "error",
    result: false,
    reason: "This endpoint is deprecated. Using onchain verification instead.",
    contractAddress: "0x3E5e80BC7DE408F9D63963501179a50b251cBDa3",
    network: "Celo Mainnet",
  });
}
