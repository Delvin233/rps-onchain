import { NextRequest, NextResponse } from "next/server";
import { turso } from "~~/lib/turso";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
    }

    // Query Turso database for verification status
    const result = await turso.execute({
      sql: "SELECT verified, verification_data, updated_at FROM user_verifications WHERE address = ?",
      args: [address.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        verified: false,
        source: "turso",
        error: "Address not found in database",
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      verified: Boolean(row.verified),
      source: "turso",
      verificationData: row.verification_data ? JSON.parse(row.verification_data as string) : null,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error("Error querying verification from Turso:", error);
    return NextResponse.json(
      {
        error: "Database query failed",
        verified: false,
        source: "turso",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, verified, verificationData, txHash } = body;

    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
    }

    // Insert or update verification status in Turso
    await turso.execute({
      sql: `
        INSERT INTO user_verifications (address, verified, verification_data, tx_hash, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(address) DO UPDATE SET
          verified = excluded.verified,
          verification_data = excluded.verification_data,
          tx_hash = excluded.tx_hash,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        address.toLowerCase(),
        verified ? 1 : 0,
        verificationData ? JSON.stringify(verificationData) : null,
        txHash || null,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Verification status synced successfully",
    });
  } catch (error) {
    console.error("Error syncing verification to Turso:", error);
    return NextResponse.json(
      {
        error: "Failed to sync verification status",
        success: false,
      },
      { status: 500 },
    );
  }
}
