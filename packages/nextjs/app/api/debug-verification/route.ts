import { NextRequest, NextResponse } from "next/server";
import { turso } from "~~/lib/turso";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    switch (action) {
      case "status":
        // Check if table exists and get basic info
        const tableInfo = await turso.execute(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='user_verifications'",
        );
        const tableExists = tableInfo.rows.length > 0;

        if (tableExists) {
          const count = await turso.execute("SELECT COUNT(*) as count FROM user_verifications");
          const sample = await turso.execute("SELECT * FROM user_verifications LIMIT 5");

          return NextResponse.json({
            tableExists: true,
            totalRecords: count.rows[0].count,
            sampleRecords: sample.rows,
          });
        } else {
          return NextResponse.json({
            tableExists: false,
            message: "user_verifications table does not exist",
          });
        }

      case "create-table":
        // Force create table
        await turso.execute(`
          CREATE TABLE IF NOT EXISTS user_verifications (
            address TEXT PRIMARY KEY,
            verified INTEGER NOT NULL DEFAULT 0,
            verification_data TEXT,
            tx_hash TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        return NextResponse.json({ success: true, message: "Table created" });

      case "test-insert":
        // Test insert
        const testAddress = "0x1234567890123456789012345678901234567890";
        await turso.execute({
          sql: `INSERT OR REPLACE INTO user_verifications 
                (address, verified, verification_data, updated_at) 
                VALUES (?, ?, ?, datetime('now'))`,
          args: [testAddress, 1, JSON.stringify({ test: true })],
        });

        const result = await turso.execute({
          sql: "SELECT * FROM user_verifications WHERE address = ?",
          args: [testAddress],
        });

        return NextResponse.json({
          success: true,
          message: "Test insert completed",
          result: result.rows[0],
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Debug verification error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
