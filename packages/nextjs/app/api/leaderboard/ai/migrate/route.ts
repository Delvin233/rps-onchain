import { NextResponse } from "next/server";
import { getRankForWins } from "~~/lib/ranks";
import { turso } from "~~/lib/turso";

/**
 * Migration endpoint to populate AI leaderboard with existing players
 *
 * This endpoint:
 * 1. Queries all players from stats table with ai_wins > 0
 * 2. Calculates their rank based on current wins
 * 3. Inserts them into ai_leaderboards table
 * 4. Is idempotent (safe to run multiple times)
 *
 * POST /api/leaderboard/ai/migrate
 */
export async function POST() {
  try {
    console.log("[Migration] Starting AI leaderboard migration...");

    // Query all players with AI wins from stats table
    const statsResult = await turso.execute({
      sql: "SELECT address, ai_wins FROM stats WHERE ai_wins > 0",
    });

    console.log(`[Migration] Found ${statsResult.rows.length} players with AI wins`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each player
    for (const row of statsResult.rows) {
      const address = (row.address as string).toLowerCase();
      const aiWins = Number(row.ai_wins);

      try {
        // Calculate rank based on wins
        const rank = getRankForWins(aiWins);

        // Check if player already exists in leaderboard
        const existingResult = await turso.execute({
          sql: "SELECT address FROM ai_leaderboards WHERE address = ?",
          args: [address],
        });

        if (existingResult.rows.length > 0) {
          // Player already migrated, skip
          skipped++;
          console.log(`[Migration] Skipped ${address} (already exists)`);
          continue;
        }

        // Insert into leaderboard
        await turso.execute({
          sql: `INSERT INTO ai_leaderboards (address, wins, rank, display_name, updated_at)
                VALUES (?, ?, ?, ?, ?)`,
          args: [address, aiWins, rank.name, null, Date.now()],
        });

        migrated++;
        console.log(`[Migration] Migrated ${address}: ${aiWins} wins → ${rank.name}`);
      } catch (error) {
        errors++;
        console.error(`[Migration] Failed to migrate ${address}:`, error);
      }
    }

    const summary = {
      success: true,
      total: statsResult.rows.length,
      migrated,
      skipped,
      errors,
      message: `Migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`,
    };

    console.log("[Migration] Summary:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
