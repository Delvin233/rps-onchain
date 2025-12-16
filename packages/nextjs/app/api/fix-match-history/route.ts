import { NextRequest, NextResponse } from "next/server";

/**
 * Simple fix for match history - just normalize addresses to lowercase
 * This is the "keep it simple" approach
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
  }

  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Simple debug: check what matches exist for this address
    const [historyResponse, aiResponse, dbResponse] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/history?address=${addressLower}`),
      fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/ai-match/history?playerId=${addressLower}&limit=100`,
      ),
      fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user-matches?address=${addressLower}`),
    ]);

    const results = {
      address: addressLower,
      history: historyResponse.ok ? await historyResponse.json() : { matches: [] },
      aiMatches: aiResponse.ok ? await aiResponse.json() : { matches: [] },
      dbMatches: dbResponse.ok ? await dbResponse.json() : { matches: [] },
    };

    return NextResponse.json({
      success: true,
      debug: {
        totalHistoryMatches: results.history.matches?.length || 0,
        totalAiMatches: results.aiMatches.matches?.length || 0,
        totalDbMatches: results.dbMatches.matches?.length || 0,
        sampleHistoryMatch: results.history.matches?.[0] || null,
        sampleAiMatch: results.aiMatches.matches?.[0] || null,
        sampleDbMatch: results.dbMatches.matches?.[0] || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
