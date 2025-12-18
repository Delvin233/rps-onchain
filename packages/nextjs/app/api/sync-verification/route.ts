import { NextRequest, NextResponse } from "next/server";
import { initUserVerificationsTable, turso } from "~~/lib/turso";

// Initialize table on first request
let tableInitialized = false;

async function ensureTable() {
  if (!tableInitialized) {
    await initUserVerificationsTable();
    tableInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  await ensureTable();
  try {
    const { address, verified, verificationData, txHash } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // Upsert verification status in Turso
    await turso.execute({
      sql: `
        INSERT OR REPLACE INTO user_verifications 
        (address, verified, verification_data, tx_hash, updated_at) 
        VALUES (?, ?, ?, ?, datetime('now'))
      `,
      args: [
        address.toLowerCase(),
        verified ? 1 : 0,
        verificationData ? JSON.stringify(verificationData) : null,
        txHash || null,
      ],
    });

    console.log(`[Sync] Verification synced to Turso for ${address}: ${verified}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error syncing verification to Turso:", error);
    return NextResponse.json({ error: "Failed to sync verification" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  await ensureTable();

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // Get verification status from Turso
    const result = await turso.execute({
      sql: "SELECT verified, verification_data, updated_at FROM user_verifications WHERE address = ?",
      args: [address.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ verified: false, source: "turso" });
    }

    const row = result.rows[0];
    return NextResponse.json({
      verified: Boolean(row.verified),
      verificationData: row.verification_data ? JSON.parse(row.verification_data as string) : null,
      updatedAt: row.updated_at,
      source: "turso",
    });
  } catch (error) {
    console.error("Error getting verification from Turso:", error);
    return NextResponse.json({ error: "Failed to get verification" }, { status: 500 });
  }
}
