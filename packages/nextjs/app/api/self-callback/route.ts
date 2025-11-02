import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo (use proper database in production)
const verificationStore = new Map<string, { verified: boolean; proof?: any }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify the Self Protocol callback
    if (body.status === "verified" && body.proof && body.sessionId) {
      verificationStore.set(body.sessionId, {
        verified: true,
        proof: body.proof,
      });

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

    if (!sessionId) {
      return NextResponse.json({ verified: false });
    }

    const verification = verificationStore.get(sessionId);

    return NextResponse.json({
      verified: verification?.verified || false,
      proof: verification?.proof,
    });
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
