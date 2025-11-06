import { NextRequest, NextResponse } from "next/server";
import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { updateEdgeConfig } from "~~/lib/edgeConfigClient";

const SCOPE = "rps-onchain";
const ENDPOINT = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/verify`
  : "http://localhost:3000/api/verify";

const selfBackendVerifier = new SelfBackendVerifier(
  SCOPE,
  ENDPOINT,
  false, // false = mainnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [],
    ofac: false,
  }),
  "hex", // Using hex for blockchain addresses
);

export async function POST(request: NextRequest) {
  try {
    const { attestationId, proof, publicSignals, userContextData } = await request.json();

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json({
        status: "error",
        result: false,
        reason: "Proof, publicSignals, attestationId and userContextData are required",
      });
    }

    console.log("Verifying with scope:", SCOPE, "endpoint:", ENDPOINT);
    const result = await selfBackendVerifier.verify(attestationId, proof, publicSignals, userContextData);

    const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;

    if (!isValid || !isMinimumAgeValid || isOfacValid) {
      let reason = "Verification failed";
      if (!isMinimumAgeValid) reason = "Minimum age verification failed";
      if (isOfacValid) reason = "OFAC verification failed";

      return NextResponse.json({
        status: "error",
        result: false,
        reason,
      });
    }

    // Store verification in Edge Config
    const address = result.userData.userIdentifier.toLowerCase();
    const verificationData = {
      verified: true,
      proof: result,
      timestamp: Date.now(),
    };

    try {
      await updateEdgeConfig(`verified:${address}`, verificationData);
      console.log(`✅ Verification stored for ${address}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Failed to store verification:", errorMsg);
      console.error("Edge Config ID:", process.env.EDGE_CONFIG_ID ? "Set" : "Missing");
      console.error("Vercel API Token:", process.env.VERCEL_API_TOKEN ? "Set" : "Missing");
      return NextResponse.json({
        status: "error",
        result: false,
        reason: `Storage failed: ${errorMsg}`,
      });
    }

    return NextResponse.json({
      status: "success",
      result: true,
      address,
      ...verificationData,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({
      status: "error",
      result: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
