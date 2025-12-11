/**
 * Migration Runner
 *
 * Handles execution and tracking of database migrations for the RPS OnChain application.
 * Ensures migrations are run in order and tracks completion status.
 */
import { turso } from "../turso";
import { getMigrationStatus, migrateAIMatches, rollbackAIMatchesMigration } from "./001_ai_matches_migration";

export interface Migration {
  id: string;
  name: string;
  description: string;
  execute: () => Promise<{ success: boolean; message: string; affectedRows?: number; errors?: string[] }>;
  rollback?: () => Promise<{ success: boolean; message: string; errors?: string[] }>;
}

export interface MigrationRecord {
  id: string;
  name: string;
  executed_at: string;
  success: boolean;
  message: string;
  affected_rows?: number;
}

/**
 * Available migrations in execution order
 */
const MIGRATIONS: Migration[] = [
  {
    id: "001",
    name: "ai_matches_migration",
    description: "Add best-of-three AI matches support with match-level statistics",
    execute: migrateAIMatches,
    rollback: rollbackAIMatchesMigration,
  },
];

/**
 * Initialize the migrations tracking table
 */
async function initMigrationsTable(): Promise<void> {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at TEXT NOT NULL,
      success BOOLEAN NOT NULL,
      message TEXT NOT NULL,
      affected_rows INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Check if a migration has been executed
 */
async function isMigrationExecuted(migrationId: string): Promise<boolean> {
  const result = await turso.execute({
    sql: "SELECT success FROM migrations WHERE id = ? AND success = 1",
    args: [migrationId],
  });
  return result.rows.length > 0;
}

/**
 * Record migration execution
 */
async function recordMigration(
  migration: Migration,
  result: { success: boolean; message: string; affectedRows?: number },
): Promise<void> {
  await turso.execute({
    sql: `INSERT OR REPLACE INTO migrations (id, name, executed_at, success, message, affected_rows)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      migration.id,
      migration.name,
      new Date().toISOString(),
      result.success,
      result.message,
      result.affectedRows || 0,
    ],
  });
}

/**
 * Execute a specific migration
 */
export async function executeMigration(migrationId: string): Promise<{
  success: boolean;
  message: string;
  migration?: Migration;
  result?: any;
}> {
  await initMigrationsTable();

  const migration = MIGRATIONS.find(m => m.id === migrationId);
  if (!migration) {
    return {
      success: false,
      message: `Migration ${migrationId} not found`,
    };
  }

  // Check if already executed
  if (await isMigrationExecuted(migrationId)) {
    return {
      success: true,
      message: `Migration ${migrationId} (${migration.name}) already executed`,
      migration,
    };
  }

  console.log(`🚀 Executing migration ${migrationId}: ${migration.name}`);
  console.log(`📝 Description: ${migration.description}`);

  try {
    const result = await migration.execute();
    await recordMigration(migration, result);

    if (result.success) {
      console.log(`✅ Migration ${migrationId} completed successfully`);
    } else {
      console.error(`❌ Migration ${migrationId} failed:`, result.message);
    }

    return {
      success: result.success,
      message: result.message,
      migration,
      result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Migration ${migrationId} threw an error:`, error);

    await recordMigration(migration, {
      success: false,
      message: `Migration failed with error: ${errorMessage}`,
    });

    return {
      success: false,
      message: errorMessage,
      migration,
    };
  }
}

/**
 * Execute all pending migrations
 */
export async function executeAllMigrations(): Promise<{
  success: boolean;
  message: string;
  executed: string[];
  failed: string[];
  results: any[];
}> {
  await initMigrationsTable();

  const executed: string[] = [];
  const failed: string[] = [];
  const results: any[] = [];

  console.log(`🚀 Starting migration process (${MIGRATIONS.length} migrations available)`);

  for (const migration of MIGRATIONS) {
    console.log(`\n📋 Checking migration ${migration.id}: ${migration.name}`);

    if (await isMigrationExecuted(migration.id)) {
      console.log(`⏭️  Migration ${migration.id} already executed, skipping`);
      continue;
    }

    const result = await executeMigration(migration.id);
    results.push(result);

    if (result.success) {
      executed.push(migration.id);
    } else {
      failed.push(migration.id);
      console.error(`❌ Migration ${migration.id} failed, stopping migration process`);
      break; // Stop on first failure to maintain data integrity
    }
  }

  const allSuccess = failed.length === 0;
  const message = allSuccess
    ? `All migrations completed successfully. Executed: ${executed.length}, Failed: ${failed.length}`
    : `Migration process stopped due to failures. Executed: ${executed.length}, Failed: ${failed.length}`;

  console.log(`\n🎯 Migration process complete: ${message}`);

  return {
    success: allSuccess,
    message,
    executed,
    failed,
    results,
  };
}

/**
 * Rollback a specific migration
 */
export async function rollbackMigration(migrationId: string): Promise<{
  success: boolean;
  message: string;
  migration?: Migration;
}> {
  await initMigrationsTable();

  const migration = MIGRATIONS.find(m => m.id === migrationId);
  if (!migration) {
    return {
      success: false,
      message: `Migration ${migrationId} not found`,
    };
  }

  if (!migration.rollback) {
    return {
      success: false,
      message: `Migration ${migrationId} does not support rollback`,
      migration,
    };
  }

  console.log(`🔄 Rolling back migration ${migrationId}: ${migration.name}`);

  try {
    const result = await migration.rollback();

    // Remove from migrations table if rollback successful
    if (result.success) {
      await turso.execute({
        sql: "DELETE FROM migrations WHERE id = ?",
        args: [migrationId],
      });
      console.log(`✅ Migration ${migrationId} rolled back successfully`);
    } else {
      console.error(`❌ Migration ${migrationId} rollback failed:`, result.message);
    }

    return {
      success: result.success,
      message: result.message,
      migration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Migration ${migrationId} rollback threw an error:`, error);

    return {
      success: false,
      message: errorMessage,
      migration,
    };
  }
}

/**
 * Get migration status for all migrations
 */
export async function getMigrationsStatus(): Promise<{
  totalMigrations: number;
  executedMigrations: number;
  pendingMigrations: string[];
  executedMigrations_list: MigrationRecord[];
  lastMigration?: MigrationRecord;
}> {
  await initMigrationsTable();

  const executedResult = await turso.execute(`
    SELECT * FROM migrations WHERE success = 1 ORDER BY executed_at DESC
  `);

  const executedMigrations_list: MigrationRecord[] = executedResult.rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    executed_at: row.executed_at as string,
    success: Boolean(row.success),
    message: row.message as string,
    affected_rows: row.affected_rows ? Number(row.affected_rows) : undefined,
  }));

  const executedIds = new Set(executedMigrations_list.map(m => m.id));
  const pendingMigrations = MIGRATIONS.filter(m => !executedIds.has(m.id)).map(m => m.id);

  return {
    totalMigrations: MIGRATIONS.length,
    executedMigrations: executedMigrations_list.length,
    pendingMigrations,
    executedMigrations_list,
    lastMigration: executedMigrations_list[0],
  };
}

/**
 * Get detailed status for AI matches migration specifically
 */
export async function getAIMatchesMigrationStatus() {
  const generalStatus = await getMigrationsStatus();
  const aiMatchesStatus = await getMigrationStatus();

  return {
    ...generalStatus,
    aiMatchesSpecific: aiMatchesStatus,
  };
}

/**
 * Verify database integrity after migrations
 */
export async function verifyDatabaseIntegrity(): Promise<{
  success: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
}> {
  const checks: Array<{ name: string; passed: boolean; message: string }> = [];

  try {
    // Check if all expected tables exist
    const tables = await turso.execute(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);
    const tableNames = tables.rows.map(row => row.name as string);

    const expectedTables = ["stats", "matches", "users", "ai_matches", "migrations"];
    for (const expectedTable of expectedTables) {
      const exists = tableNames.includes(expectedTable);
      checks.push({
        name: `Table ${expectedTable} exists`,
        passed: exists,
        message: exists ? "Table found" : "Table missing",
      });
    }

    // Check stats table has new columns
    if (tableNames.includes("stats")) {
      const statsInfo = await turso.execute(`PRAGMA table_info(stats)`);
      const statsColumns = statsInfo.rows.map(row => row.name as string);

      const expectedColumns = [
        "ai_matches_played",
        "ai_matches_won",
        "ai_matches_lost",
        "ai_matches_tied",
        "ai_matches_abandoned",
      ];
      for (const expectedCol of expectedColumns) {
        const exists = statsColumns.includes(expectedCol);
        checks.push({
          name: `Stats column ${expectedCol} exists`,
          passed: exists,
          message: exists ? "Column found" : "Column missing",
        });
      }
    }

    // Check for data integrity
    const statsCount = await turso.execute("SELECT COUNT(*) as count FROM stats");
    const totalUsers = Number(statsCount.rows[0].count);

    if (totalUsers > 0) {
      const nullMatchDataCount = await turso.execute(`
        SELECT COUNT(*) as count FROM stats 
        WHERE ai_matches_played IS NULL
      `);
      const usersWithNullData = Number(nullMatchDataCount.rows[0].count);

      checks.push({
        name: "All users have match data initialized",
        passed: usersWithNullData === 0,
        message:
          usersWithNullData === 0
            ? `All ${totalUsers} users have match data`
            : `${usersWithNullData} users missing match data`,
      });
    }
  } catch (error) {
    checks.push({
      name: "Database integrity check",
      passed: false,
      message: `Error during integrity check: ${error}`,
    });
  }

  const allPassed = checks.every(check => check.passed);

  return {
    success: allPassed,
    checks,
  };
}
