import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { turso } from "~~/lib/turso";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ verified: false });
    }

    const normalizedAddress = address.toLowerCase();

    // Try Turso first
    try {
      const result = await turso.execute({
        sql: "SELECT verified, proof_data, timestamp_ms FROM verifications WHERE address = ?",
        args: [normalizedAddress],
      });

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return NextResponse.json({
          verified: Boolean(row.verified),
          proof: row.proof_data ? JSON.parse(row.proof_data as string) : null,
          timestamp: row.timestamp_ms,
        });
      }
    } catch (tursoError) {
      console.error("Turso lookup failed, trying Edge Config fallback:", tursoError);
    }

    // Fallback to Edge Config for legacy data
    if (process.env.EDGE_CONFIG) {
      try {
        const verification = await get(`verified_${normalizedAddress}`);
        if (verification) {
          return NextResponse.json(verification);
        }
      } catch (edgeError) {
        console.error("Edge Config fallback failed:", edgeError);
      }
    }

    return NextResponse.json({ verified: false });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
