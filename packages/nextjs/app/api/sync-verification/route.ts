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
  try {
    await ensureTable();
  } catch (tableError) {
    console.error("[Sync] Failed to ensure table exists:", tableError);
    return NextResponse.json({ error: "Database initialization failed" }, { status: 500 });
  }

  try {
    const { address, verified, verificationData, txHash } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    console.log(`[Sync] Attempting to sync verification for ${address}: ${verified}`);

    // Upsert verification status in Turso
    const result = await turso.execute({
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

    console.log(`[Sync] Verification synced to Turso for ${address}: ${verified}`, result);

    return NextResponse.json({ success: true, address: address.toLowerCase(), verified });
  } catch (error) {
    console.error("[Sync] Error syncing verification to Turso:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to sync verification", details: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();
  } catch (tableError) {
    console.error("[Sync] Failed to ensure table exists:", tableError);
    return NextResponse.json({ error: "Database initialization failed" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    console.log(`[Sync] Getting verification status for ${address}`);

    // Get verification status from Turso
    const result = await turso.execute({
      sql: "SELECT verified, verification_data, updated_at FROM user_verifications WHERE address = ?",
      args: [address.toLowerCase()],
    });

    if (result.rows.length === 0) {
      console.log(`[Sync] No verification record found for ${address}`);
      return NextResponse.json({ verified: false, source: "turso" });
    }

    const row = result.rows[0];
    const response = {
      verified: Boolean(row.verified),
      verificationData: row.verification_data ? JSON.parse(row.verification_data as string) : null,
      updatedAt: row.updated_at,
      source: "turso",
    };

    console.log(`[Sync] Found verification record for ${address}:`, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[Sync] Error getting verification from Turso:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to get verification", details: errorMessage }, { status: 500 });
  }
}
