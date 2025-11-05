import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { updateEdgeConfig } from "~~/lib/edgeConfigClient";

const verificationStore = new Map<string, { verified: boolean; proof?: any }>();

export async function POST(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const address = searchParams.get("address");

    console.log("Self Protocol callback received:", { body, sessionId, address });

    // Verify the Self Protocol callback
    if (body.verified || body.status === "verified") {
      const data = { verified: true, proof: body.proof || body, timestamp: Date.now() };

      if (sessionId) {
        verificationStore.set(sessionId, data);
      }

      if (address) {
        verificationStore.set(`addr:${address}`, data);
        // Persist to Edge Config
        await updateEdgeConfig(`verified:${address}`, data);
      }

      return NextResponse.json(
        {
          success: true,
          verified: true,
          proof: data.proof,
        },
        { headers },
      );
    }

    return NextResponse.json(
      {
        success: false,
        verified: false,
      },
      { headers },
    );
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Callback processing failed",
      },
      { status: 500, headers },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const address = searchParams.get("address");

    if (address) {
      let verification = verificationStore.get(`addr:${address}`);

      if (!verification) {
        verification = await get(`verified:${address}`);
      }

      if (verification) {
        return NextResponse.json(verification, { headers });
      }
    }

    if (sessionId) {
      const verification = verificationStore.get(sessionId);
      if (verification) {
        return NextResponse.json(verification, { headers });
      }
    }

    return NextResponse.json({ verified: false }, { headers });
  } catch {
    return NextResponse.json(
      {
        verified: false,
        error: "Status check failed",
      },
      { status: 500, headers },
    );
  }
}
