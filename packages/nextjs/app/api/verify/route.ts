import { NextRequest, NextResponse } from "next/server";
import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { initVerificationsTable, turso } from "~~/lib/turso";

const SCOPE = "rpsonchain";
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

    // Store verification in Turso
    const address = result.userData.userIdentifier.toLowerCase();
    const timestamp = Date.now();
    const verificationData = {
      verified: true,
      proof: result,
      timestamp,
    };

    // Only store in Turso if environment variables are available
    if (process.env.TURSO_DATABASE_URL) {
      try {
        await initVerificationsTable();
        await turso.execute({
          sql: `INSERT INTO verifications (address, verified, proof_data, timestamp_ms) 
                VALUES (?, ?, ?, ?) 
                ON CONFLICT(address) DO UPDATE SET 
                  verified = excluded.verified,
                  proof_data = excluded.proof_data,
                  timestamp_ms = excluded.timestamp_ms`,
          args: [address, 1, JSON.stringify(result), timestamp],
        });
        console.log(`✅ Verification stored in Turso for ${address}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("❌ Failed to store verification:", errorMsg);
        return NextResponse.json({
          status: "error",
          result: false,
          reason: `Storage failed: ${errorMsg}`,
        });
      }
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
