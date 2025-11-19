import { NextRequest, NextResponse } from "next/server";
import { getAll } from "@vercel/edge-config";
import { initVerificationsTable, turso } from "~~/lib/turso";

export async function POST(request: NextRequest) {
  try {
    // Security: Add a secret key check in production
    const { secret } = await request.json();
    if (secret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.EDGE_CONFIG) {
      return NextResponse.json({ error: "Edge Config not configured" }, { status: 400 });
    }

    // Initialize table
    await initVerificationsTable();

    // Get all Edge Config data
    const allData = await getAll();
    if (!allData) {
      return NextResponse.json({ message: "No data in Edge Config", migrated: 0 });
    }

    let migrated = 0;
    let errors = 0;

    // Filter and migrate verification entries
    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith("verified_")) {
        const address = key.replace("verified_", "");
        const data = value as any;

        try {
          await turso.execute({
            sql: `INSERT INTO verifications (address, verified, proof_data, timestamp_ms) 
                  VALUES (?, ?, ?, ?) 
                  ON CONFLICT(address) DO UPDATE SET 
                    verified = excluded.verified,
                    proof_data = excluded.proof_data,
                    timestamp_ms = excluded.timestamp_ms`,
            args: [address, data.verified ? 1 : 0, JSON.stringify(data.proof || {}), data.timestamp || Date.now()],
          });
          migrated++;
          console.log(`✅ Migrated ${address}`);
        } catch (error) {
          errors++;
          console.error(`❌ Failed to migrate ${address}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: "Migration complete",
      migrated,
      errors,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
