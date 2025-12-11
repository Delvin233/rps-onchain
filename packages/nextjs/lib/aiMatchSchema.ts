/**
 * AI Match Database Schema Extensions
 *
 * This file contains the database schema definitions and migration scripts
 * for the best-of-three AI match system.
 */
import { turso } from "./turso";

/**
 * Initialize the AI matches table for storing completed matches
 */
export async function initAIMatchesTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS ai_matches (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
      player_score INTEGER NOT NULL DEFAULT 0 CHECK (player_score >= 0 AND player_score <= 2),
      ai_score INTEGER NOT NULL DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 2),
      current_round INTEGER NOT NULL DEFAULT 1 CHECK (current_round >= 1 AND current_round <= 3),
      rounds_data TEXT NOT NULL DEFAULT '[]',
      started_at TEXT NOT NULL,
      last_activity_at TEXT NOT NULL,
      completed_at TEXT,
      winner TEXT CHECK (winner IN ('player', 'ai', 'tie')),
      is_abandoned BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for performance
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_player_id ON ai_matches(player_id)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_status ON ai_matches(status)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_completed_at ON ai_matches(completed_at DESC)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_created_at ON ai_matches(created_at DESC)`);
}

/**
 * Extend the existing stats table with match-level columns
 */
export async function extendStatsTableForMatches() {
  // Add new columns for AI match tracking
  const matchColumns = [
    "ai_matches_played INTEGER DEFAULT 0",
    "ai_matches_won INTEGER DEFAULT 0",
    "ai_matches_lost INTEGER DEFAULT 0",
    "ai_matches_tied INTEGER DEFAULT 0",
    "ai_matches_abandoned INTEGER DEFAULT 0",
  ];

  for (const column of matchColumns) {
    try {
      await turso.execute(`ALTER TABLE stats ADD COLUMN ${column}`);
    } catch {
      // Column already exists, ignore error
      console.log(`Column ${column.split(" ")[0]} already exists in stats table`);
    }
  }
}

/**
 * Create database migration script for existing data
 */
export async function migrateExistingData() {
  console.log("Starting AI match database migration...");

  try {
    // Initialize new tables
    await initAIMatchesTable();
    await extendStatsTableForMatches();

    // Set default values for existing users in stats table
    await turso.execute(`
      UPDATE stats 
      SET 
        ai_matches_played = COALESCE(ai_matches_played, 0),
        ai_matches_won = COALESCE(ai_matches_won, 0),
        ai_matches_lost = COALESCE(ai_matches_lost, 0),
        ai_matches_tied = COALESCE(ai_matches_tied, 0),
        ai_matches_abandoned = COALESCE(ai_matches_abandoned, 0)
      WHERE 
        ai_matches_played IS NULL OR
        ai_matches_won IS NULL OR
        ai_matches_lost IS NULL OR
        ai_matches_tied IS NULL OR
        ai_matches_abandoned IS NULL
    `);

    console.log("AI match database migration completed successfully");
  } catch (error) {
    console.error("Error during AI match database migration:", error);
    throw error;
  }
}

/**
 * Rollback migration (for testing purposes)
 */
export async function rollbackMigration() {
  console.log("Rolling back AI match database migration...");

  try {
    // Drop AI matches table
    await turso.execute("DROP TABLE IF EXISTS ai_matches");

    // Remove added columns from stats table (SQLite doesn't support DROP COLUMN easily)
    // We'll leave them as they have default values and won't interfere
    console.log("Note: Match-level columns in stats table are left in place (SQLite limitation)");

    console.log("AI match database migration rollback completed");
  } catch (error) {
    console.error("Error during rollback:", error);
    throw error;
  }
}

/**
 * Verify database schema integrity
 */
export async function verifySchema(): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Check if ai_matches table exists with correct structure
    const tableInfo = await turso.execute(`PRAGMA table_info(ai_matches)`);

    const expectedColumns = [
      "id",
      "player_id",
      "status",
      "player_score",
      "ai_score",
      "current_round",
      "rounds_data",
      "started_at",
      "last_activity_at",
      "completed_at",
      "winner",
      "is_abandoned",
      "created_at",
    ];

    const actualColumns = tableInfo.rows.map(row => row.name as string);

    for (const expectedCol of expectedColumns) {
      if (!actualColumns.includes(expectedCol)) {
        errors.push(`Missing column '${expectedCol}' in ai_matches table`);
      }
    }

    // Check if stats table has new columns
    const statsInfo = await turso.execute(`PRAGMA table_info(stats)`);
    const statsColumns = statsInfo.rows.map(row => row.name as string);

    const expectedStatsColumns = [
      "ai_matches_played",
      "ai_matches_won",
      "ai_matches_lost",
      "ai_matches_tied",
      "ai_matches_abandoned",
    ];

    for (const expectedCol of expectedStatsColumns) {
      if (!statsColumns.includes(expectedCol)) {
        errors.push(`Missing column '${expectedCol}' in stats table`);
      }
    }

    // Check indexes
    const indexes = await turso.execute(`PRAGMA index_list(ai_matches)`);
    const indexNames = indexes.rows.map(row => row.name as string);

    const expectedIndexes = [
      "idx_ai_matches_player_id",
      "idx_ai_matches_status",
      "idx_ai_matches_completed_at",
      "idx_ai_matches_created_at",
    ];

    for (const expectedIndex of expectedIndexes) {
      if (!indexNames.includes(expectedIndex)) {
        errors.push(`Missing index '${expectedIndex}' on ai_matches table`);
      }
    }
  } catch (error) {
    errors.push(`Schema verification failed: ${error}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get database statistics for monitoring
 */
export async function getDatabaseStats() {
  try {
    const aiMatchesCount = await turso.execute("SELECT COUNT(*) as count FROM ai_matches");
    const activeMatchesCount = await turso.execute(`SELECT COUNT(*) as count FROM ai_matches WHERE status = 'active'`);
    const completedMatchesCount = await turso.execute(
      `SELECT COUNT(*) as count FROM ai_matches WHERE status = 'completed'`,
    );
    const abandonedMatchesCount = await turso.execute(
      `SELECT COUNT(*) as count FROM ai_matches WHERE status = 'abandoned'`,
    );

    const playersWithMatches = await turso.execute(`
      SELECT COUNT(DISTINCT player_id) as count FROM ai_matches
    `);

    return {
      totalMatches: Number(aiMatchesCount.rows[0].count),
      activeMatches: Number(activeMatchesCount.rows[0].count),
      completedMatches: Number(completedMatchesCount.rows[0].count),
      abandonedMatches: Number(abandonedMatchesCount.rows[0].count),
      playersWithMatches: Number(playersWithMatches.rows[0].count),
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    throw error;
  }
}

/**
 * Clean up old abandoned matches (for maintenance)
 */
export async function cleanupOldMatches(olderThanDays: number = 7) {
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const result = await turso.execute({
      sql: `DELETE FROM ai_matches 
            WHERE status = 'abandoned' 
            AND last_activity_at < ?`,
      args: [cutoffDate],
    });

    console.log(`Cleaned up ${result.rowsAffected} old abandoned matches`);
    return result.rowsAffected;
  } catch (error) {
    console.error("Error cleaning up old matches:", error);
    throw error;
  }
}

/**
 * Initialize all AI match related database components
 */
export async function initAIMatchDatabase() {
  console.log("Initializing AI match database components...");

  try {
    await initAIMatchesTable();
    await extendStatsTableForMatches();

    // Verify schema
    const verification = await verifySchema();
    if (!verification.isValid) {
      console.warn("Schema verification warnings:", verification.errors);
    }

    console.log("AI match database initialization completed");
  } catch (error) {
    console.error("Error initializing AI match database:", error);
    throw error;
  }
}
