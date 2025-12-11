/**
 * Migration 001: AI Matches Best-of-Three System
 *
 * This migration adds support for best-of-three AI matches by:
 * 1. Creating the ai_matches table for storing match data
 * 2. Extending the stats table with match-level columns
 * 3. Preserving all existing player statistics and history
 * 4. Ensuring no data loss during migration
 *
 * Requirements: 7.1, 7.3
 */
import { turso } from "../turso";

export interface MigrationResult {
  success: boolean;
  message: string;
  affectedRows?: number;
  errors?: string[];
}

/**
 * Execute the AI matches migration
 */
export async function migrateAIMatches(): Promise<MigrationResult> {
  console.log("🚀 Starting AI Matches Migration (001)...");

  try {
    // Step 1: Create ai_matches table
    await createAIMatchesTable();
    console.log("✅ Created ai_matches table");

    // Step 2: Extend stats table with match-level columns
    const statsResult = await extendStatsTable();
    console.log(`✅ Extended stats table (${statsResult.affectedRows} rows updated)`);

    // Step 3: Initialize new columns with default values for existing users
    const initResult = await initializeExistingUserStats();
    console.log(`✅ Initialized existing user stats (${initResult.affectedRows} users updated)`);

    // Step 4: Verify migration integrity
    const verification = await verifyMigration();
    if (!verification.success) {
      throw new Error(`Migration verification failed: ${verification.errors?.join(", ")}`);
    }
    console.log("✅ Migration verification passed");

    console.log("🎉 AI Matches Migration completed successfully!");

    return {
      success: true,
      message: "AI Matches migration completed successfully",
      affectedRows: statsResult.affectedRows + initResult.affectedRows,
    };
  } catch (error) {
    console.error("❌ AI Matches Migration failed:", error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: [String(error)],
    };
  }
}

/**
 * Create the ai_matches table for storing best-of-three match data
 */
async function createAIMatchesTable(): Promise<void> {
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

  // Create performance indexes
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_player_id ON ai_matches(player_id)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_status ON ai_matches(status)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_completed_at ON ai_matches(completed_at DESC)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_created_at ON ai_matches(created_at DESC)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_last_activity ON ai_matches(last_activity_at)`);
}

/**
 * Extend the existing stats table with match-level columns
 */
async function extendStatsTable(): Promise<{ affectedRows: number }> {
  const newColumns = [
    { name: "ai_matches_played", definition: "INTEGER DEFAULT 0" },
    { name: "ai_matches_won", definition: "INTEGER DEFAULT 0" },
    { name: "ai_matches_lost", definition: "INTEGER DEFAULT 0" },
    { name: "ai_matches_tied", definition: "INTEGER DEFAULT 0" },
    { name: "ai_matches_abandoned", definition: "INTEGER DEFAULT 0" },
  ];

  let totalAffected = 0;

  for (const column of newColumns) {
    try {
      const result = await turso.execute(`ALTER TABLE stats ADD COLUMN ${column.name} ${column.definition}`);
      totalAffected += result.rowsAffected || 0;
      console.log(`  ✓ Added column: ${column.name}`);
    } catch (error) {
      // Column might already exist - check if it's actually there
      const tableInfo = await turso.execute(`PRAGMA table_info(stats)`);
      const columnExists = tableInfo.rows.some(row => row.name === column.name);

      if (columnExists) {
        console.log(`  ℹ Column ${column.name} already exists`);
      } else {
        console.error(`  ❌ Failed to add column ${column.name}:`, error);
        throw error;
      }
    }
  }

  return { affectedRows: totalAffected };
}

/**
 * Initialize new match-level columns with default values for existing users
 */
async function initializeExistingUserStats(): Promise<{ affectedRows: number }> {
  // Update all existing users to have default values for new columns
  const result = await turso.execute(`
    UPDATE stats 
    SET 
      ai_matches_played = COALESCE(ai_matches_played, 0),
      ai_matches_won = COALESCE(ai_matches_won, 0),
      ai_matches_lost = COALESCE(ai_matches_lost, 0),
      ai_matches_tied = COALESCE(ai_matches_tied, 0),
      ai_matches_abandoned = COALESCE(ai_matches_abandoned, 0),
      updated_at = CURRENT_TIMESTAMP
    WHERE 
      ai_matches_played IS NULL OR
      ai_matches_won IS NULL OR
      ai_matches_lost IS NULL OR
      ai_matches_tied IS NULL OR
      ai_matches_abandoned IS NULL
  `);

  return { affectedRows: result.rowsAffected || 0 };
}

/**
 * Verify the migration was successful
 */
async function verifyMigration(): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = [];

  try {
    // Check if ai_matches table exists with correct structure
    const aiMatchesInfo = await turso.execute(`PRAGMA table_info(ai_matches)`);
    const aiMatchesColumns = aiMatchesInfo.rows.map(row => row.name as string);

    const expectedAIMatchesColumns = [
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

    for (const expectedCol of expectedAIMatchesColumns) {
      if (!aiMatchesColumns.includes(expectedCol)) {
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

    // Check indexes exist
    const indexes = await turso.execute(`PRAGMA index_list(ai_matches)`);
    const indexNames = indexes.rows.map(row => row.name as string);

    const expectedIndexes = [
      "idx_ai_matches_player_id",
      "idx_ai_matches_status",
      "idx_ai_matches_completed_at",
      "idx_ai_matches_created_at",
      "idx_ai_matches_last_activity",
    ];

    for (const expectedIndex of expectedIndexes) {
      if (!indexNames.includes(expectedIndex)) {
        errors.push(`Missing index '${expectedIndex}' on ai_matches table`);
      }
    }

    // Verify data integrity - check that existing users have default values
    const nullStatsCount = await turso.execute(`
      SELECT COUNT(*) as count FROM stats 
      WHERE ai_matches_played IS NULL 
         OR ai_matches_won IS NULL 
         OR ai_matches_lost IS NULL 
         OR ai_matches_tied IS NULL 
         OR ai_matches_abandoned IS NULL
    `);

    if (Number(nullStatsCount.rows[0].count) > 0) {
      errors.push(`Found ${nullStatsCount.rows[0].count} users with NULL values in new match columns`);
    }
  } catch (error) {
    errors.push(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Rollback the migration (for testing/emergency purposes)
 */
export async function rollbackAIMatchesMigration(): Promise<MigrationResult> {
  console.log("🔄 Rolling back AI Matches Migration...");

  try {
    // Drop ai_matches table
    await turso.execute("DROP TABLE IF EXISTS ai_matches");
    console.log("✅ Dropped ai_matches table");

    // Note: SQLite doesn't support DROP COLUMN easily, so we leave the new columns
    // They have default values and won't interfere with existing functionality
    console.log("ℹ Note: Match-level columns in stats table are left in place (SQLite limitation)");
    console.log("   These columns have default values and won't affect existing functionality");

    console.log("🎉 Migration rollback completed");

    return {
      success: true,
      message: "AI Matches migration rollback completed successfully",
    };
  } catch (error) {
    console.error("❌ Migration rollback failed:", error);
    return {
      success: false,
      message: `Rollback failed: ${error instanceof Error ? error.message : String(error)}`,
      errors: [String(error)],
    };
  }
}

/**
 * Get migration status and statistics
 */
export async function getMigrationStatus(): Promise<{
  isComplete: boolean;
  aiMatchesTableExists: boolean;
  statsTableExtended: boolean;
  totalUsers: number;
  usersWithMatchData: number;
  errors?: string[];
}> {
  try {
    // Check if ai_matches table exists
    const aiMatchesExists = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ai_matches'
    `);
    const aiMatchesTableExists = aiMatchesExists.rows.length > 0;

    // Check if stats table has new columns
    const statsInfo = await turso.execute(`PRAGMA table_info(stats)`);
    const statsColumns = statsInfo.rows.map(row => row.name as string);
    const statsTableExtended = statsColumns.includes("ai_matches_played");

    // Get user counts
    const totalUsersResult = await turso.execute("SELECT COUNT(*) as count FROM stats");
    const totalUsers = Number(totalUsersResult.rows[0].count);

    const usersWithMatchDataResult = await turso.execute(`
      SELECT COUNT(*) as count FROM stats 
      WHERE ai_matches_played IS NOT NULL
    `);
    const usersWithMatchData = Number(usersWithMatchDataResult.rows[0].count);

    const isComplete = aiMatchesTableExists && statsTableExtended && totalUsers === usersWithMatchData;

    return {
      isComplete,
      aiMatchesTableExists,
      statsTableExtended,
      totalUsers,
      usersWithMatchData,
    };
  } catch (error) {
    return {
      isComplete: false,
      aiMatchesTableExists: false,
      statsTableExtended: false,
      totalUsers: 0,
      usersWithMatchData: 0,
      errors: [String(error)],
    };
  }
}
