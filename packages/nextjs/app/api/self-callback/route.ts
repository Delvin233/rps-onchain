import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { updateEdgeConfig } from "~~/lib/edgeConfigClient";

const verificationStore = new Map<string, { verified: boolean; proof?: any }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify the Self Protocol callback
    if (body.status === "verified" && body.proof && body.sessionId) {
      const data = { verified: true, proof: body.proof, timestamp: Date.now() };

      verificationStore.set(body.sessionId, data);

      if (body.address) {
        verificationStore.set(`addr:${body.address}`, data);
        // Persist to Edge Config
        await updateEdgeConfig(`verified:${body.address}`, data);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        proof: body.proof,
      });
    }

    return NextResponse.json({
      success: false,
      verified: false,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Callback processing failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const address = searchParams.get("address");

    if (address) {
      // Check memory first
      let verification = verificationStore.get(`addr:${address}`);

      // Fallback to Edge Config
      if (!verification) {
        verification = await get(`verified:${address}`);
      }

      if (verification) {
        return NextResponse.json(verification);
      }
    }

    if (sessionId) {
      const verification = verificationStore.get(sessionId);
      if (verification) {
        return NextResponse.json(verification);
      }
    }

    return NextResponse.json({ verified: false });
  } catch {
    return NextResponse.json(
      {
        verified: false,
        error: "Status check failed",
      },
      { status: 500 },
    );
  }
}
