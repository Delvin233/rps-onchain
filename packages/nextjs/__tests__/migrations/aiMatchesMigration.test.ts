/**
 * AI Matches Migration Tests
 *
 * Tests the migration script for adding best-of-three AI matches support.
 * Ensures data integrity and proper schema changes.
 */
import {
  getMigrationStatus,
  migrateAIMatches,
  rollbackAIMatchesMigration,
} from "../../lib/migrations/001_ai_matches_migration";
import {
  executeMigration,
  getMigrationsStatus,
  rollbackMigration,
  verifyDatabaseIntegrity,
} from "../../lib/migrations/migrationRunner";
import { turso } from "../../lib/turso";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("AI Matches Migration", () => {
  // Clean up before and after each test
  beforeEach(async () => {
    // Clean up any existing test data
    await turso.execute("DROP TABLE IF EXISTS ai_matches");
    await turso.execute("DROP TABLE IF EXISTS migrations");

    // Reset stats table to original state (remove new columns if they exist)
    try {
      // Note: SQLite doesn't support DROP COLUMN, so we recreate the table
      await turso.execute("DROP TABLE IF EXISTS stats_backup");
      await turso.execute(`
        CREATE TABLE stats_backup AS 
        SELECT address, total_games, wins, losses, ties, ai_games, ai_wins, ai_ties, 
               multiplayer_games, multiplayer_wins, multiplayer_ties, updated_at
        FROM stats
      `);
      await turso.execute("DROP TABLE stats");
      await turso.execute(`
        CREATE TABLE stats (
          address TEXT PRIMARY KEY,
          total_games INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          ties INTEGER DEFAULT 0,
          ai_games INTEGER DEFAULT 0,
          ai_wins INTEGER DEFAULT 0,
          ai_ties INTEGER DEFAULT 0,
          multiplayer_games INTEGER DEFAULT 0,
          multiplayer_wins INTEGER DEFAULT 0,
          multiplayer_ties INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await turso.execute(`
        INSERT INTO stats SELECT * FROM stats_backup
      `);
      await turso.execute("DROP TABLE stats_backup");
    } catch {
      // If stats table doesn't exist, create it
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS stats (
          address TEXT PRIMARY KEY,
          total_games INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          ties INTEGER DEFAULT 0,
          ai_games INTEGER DEFAULT 0,
          ai_wins INTEGER DEFAULT 0,
          ai_ties INTEGER DEFAULT 0,
          multiplayer_games INTEGER DEFAULT 0,
          multiplayer_wins INTEGER DEFAULT 0,
          multiplayer_ties INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  });

  afterEach(async () => {
    // Clean up after tests
    await turso.execute("DROP TABLE IF EXISTS ai_matches");
    await turso.execute("DROP TABLE IF EXISTS migrations");
  });

  describe("Direct Migration Functions", () => {
    it("should successfully execute AI matches migration", async () => {
      const result = await migrateAIMatches();

      expect(result.success).toBe(true);
      expect(result.message).toContain("completed successfully");
      // affectedRows can be 0 if no existing users need updating
      expect(result.affectedRows).toBeGreaterThanOrEqual(0);
    });

    it("should create ai_matches table with correct structure", async () => {
      await migrateAIMatches();

      // Check table exists
      const tableExists = await turso.execute(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='ai_matches'
      `);
      expect(tableExists.rows.length).toBe(1);

      // Check table structure
      const tableInfo = await turso.execute(`PRAGMA table_info(ai_matches)`);
      const columns = tableInfo.rows.map(row => row.name as string);

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

      expectedColumns.forEach(col => {
        expect(columns).toContain(col);
      });
    });

    it("should add new columns to stats table", async () => {
      await migrateAIMatches();

      const tableInfo = await turso.execute(`PRAGMA table_info(stats)`);
      const columns = tableInfo.rows.map(row => row.name as string);

      const expectedNewColumns = [
        "ai_matches_played",
        "ai_matches_won",
        "ai_matches_lost",
        "ai_matches_tied",
        "ai_matches_abandoned",
      ];

      expectedNewColumns.forEach(col => {
        expect(columns).toContain(col);
      });
    });

    it("should preserve existing user data", async () => {
      // Clear any existing data first
      await turso.execute("DELETE FROM stats");

      // Add test users
      const testUsers = [
        { address: "0x123", ai_games: 5, ai_wins: 3 },
        { address: "0x456", ai_games: 10, ai_wins: 7 },
        { address: "0x789", ai_games: 2, ai_wins: 1 },
      ];

      for (const user of testUsers) {
        await turso.execute({
          sql: `INSERT INTO stats (address, ai_games, ai_wins) VALUES (?, ?, ?)`,
          args: [user.address, user.ai_games, user.ai_wins],
        });
      }

      await migrateAIMatches();

      // Verify all users still exist with original data
      for (const user of testUsers) {
        const result = await turso.execute({
          sql: "SELECT * FROM stats WHERE address = ?",
          args: [user.address],
        });

        expect(result.rows.length).toBe(1);
        const row = result.rows[0];
        expect(row.ai_games).toBe(user.ai_games);
        expect(row.ai_wins).toBe(user.ai_wins);

        // Check new columns have default values
        expect(row.ai_matches_played).toBe(0);
        expect(row.ai_matches_won).toBe(0);
        expect(row.ai_matches_lost).toBe(0);
        expect(row.ai_matches_tied).toBe(0);
        expect(row.ai_matches_abandoned).toBe(0);
      }
    });

    it("should create proper indexes", async () => {
      await migrateAIMatches();

      const indexes = await turso.execute(`PRAGMA index_list(ai_matches)`);
      const indexNames = indexes.rows.map(row => row.name as string);

      const expectedIndexes = [
        "idx_ai_matches_player_id",
        "idx_ai_matches_status",
        "idx_ai_matches_completed_at",
        "idx_ai_matches_created_at",
        "idx_ai_matches_last_activity",
      ];

      expectedIndexes.forEach(index => {
        expect(indexNames).toContain(index);
      });
    });

    it("should handle migration when already executed", async () => {
      // Run migration first time
      const firstResult = await migrateAIMatches();
      expect(firstResult.success).toBe(true);

      // Run migration second time - should not fail
      const secondResult = await migrateAIMatches();
      expect(secondResult.success).toBe(true);
    });

    it("should successfully rollback migration", async () => {
      // Execute migration first
      await migrateAIMatches();

      // Verify ai_matches table exists
      const beforeRollback = await turso.execute(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='ai_matches'
      `);
      expect(beforeRollback.rows.length).toBe(1);

      // Rollback
      const rollbackResult = await rollbackAIMatchesMigration();
      expect(rollbackResult.success).toBe(true);

      // Verify ai_matches table is gone
      const afterRollback = await turso.execute(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='ai_matches'
      `);
      expect(afterRollback.rows.length).toBe(0);
    });
  });

  describe("Migration Runner", () => {
    it("should execute migration through runner", async () => {
      const result = await executeMigration("001");

      expect(result.success).toBe(true);
      expect(result.migration?.id).toBe("001");
      expect(result.migration?.name).toBe("ai_matches_migration");
    });

    it("should track migration in migrations table", async () => {
      await executeMigration("001");

      const migrationRecord = await turso.execute({
        sql: "SELECT * FROM migrations WHERE id = ?",
        args: ["001"],
      });

      expect(migrationRecord.rows.length).toBe(1);
      const record = migrationRecord.rows[0];
      expect(record.id).toBe("001");
      expect(record.name).toBe("ai_matches_migration");
      expect(record.success).toBe(1);
    });

    it("should not re-execute completed migration", async () => {
      // Execute first time
      const firstResult = await executeMigration("001");
      expect(firstResult.success).toBe(true);

      // Execute second time
      const secondResult = await executeMigration("001");
      expect(secondResult.success).toBe(true);
      expect(secondResult.message).toContain("already executed");
    });

    it("should rollback migration through runner", async () => {
      // Execute migration
      await executeMigration("001");

      // Rollback
      const rollbackResult = await rollbackMigration("001");
      expect(rollbackResult.success).toBe(true);

      // Verify migration record is removed
      const migrationRecord = await turso.execute({
        sql: "SELECT * FROM migrations WHERE id = ?",
        args: ["001"],
      });
      expect(migrationRecord.rows.length).toBe(0);
    });

    it("should get correct migration status", async () => {
      const statusBefore = await getMigrationsStatus();
      expect(statusBefore.executedMigrations).toBe(0);
      expect(statusBefore.pendingMigrations).toContain("001");

      await executeMigration("001");

      const statusAfter = await getMigrationsStatus();
      expect(statusAfter.executedMigrations).toBe(1);
      expect(statusAfter.pendingMigrations).not.toContain("001");
    });

    it("should verify database integrity", async () => {
      await executeMigration("001");

      const integrity = await verifyDatabaseIntegrity();

      // Check that ai_matches table exists
      const aiMatchesCheck = integrity.checks.find(check => check.name === "Table ai_matches exists");
      expect(aiMatchesCheck?.passed).toBe(true);

      // Check that stats columns exist
      const statsColumnChecks = integrity.checks.filter(
        check => check.name.includes("Stats column") && check.name.includes("exists"),
      );
      expect(statsColumnChecks.every(check => check.passed)).toBe(true);
    });
  });

  describe("Migration Status", () => {
    it("should get correct AI matches migration status", async () => {
      const statusBefore = await getMigrationStatus();
      expect(statusBefore.isComplete).toBe(false);
      expect(statusBefore.aiMatchesTableExists).toBe(false);
      expect(statusBefore.statsTableExtended).toBe(false);

      await migrateAIMatches();

      const statusAfter = await getMigrationStatus();
      expect(statusAfter.isComplete).toBe(true);
      expect(statusAfter.aiMatchesTableExists).toBe(true);
      expect(statusAfter.statsTableExtended).toBe(true);
    });

    it("should track user counts correctly", async () => {
      // Clear any existing data first
      await turso.execute("DELETE FROM stats");

      // Add test users
      await turso.execute({
        sql: `INSERT INTO stats (address, ai_games) VALUES (?, ?)`,
        args: ["0x123", 5],
      });
      await turso.execute({
        sql: `INSERT INTO stats (address, ai_games) VALUES (?, ?)`,
        args: ["0x456", 3],
      });

      await migrateAIMatches();

      const status = await getMigrationStatus();
      expect(status.totalUsers).toBe(2);
      expect(status.usersWithMatchData).toBe(2);
    });
  });

  describe("Data Integrity", () => {
    it("should not lose any existing data during migration", async () => {
      // Clear any existing data first
      await turso.execute("DELETE FROM stats");

      // Create comprehensive test data
      const testData = [
        {
          address: "0x123",
          total_games: 15,
          wins: 8,
          losses: 5,
          ties: 2,
          ai_games: 10,
          ai_wins: 6,
          ai_ties: 1,
          multiplayer_games: 5,
          multiplayer_wins: 2,
          multiplayer_ties: 1,
        },
        {
          address: "0x456",
          total_games: 25,
          wins: 15,
          losses: 8,
          ties: 2,
          ai_games: 20,
          ai_wins: 12,
          ai_ties: 2,
          multiplayer_games: 5,
          multiplayer_wins: 3,
          multiplayer_ties: 0,
        },
      ];

      // Insert test data
      for (const data of testData) {
        await turso.execute({
          sql: `INSERT INTO stats (
            address, total_games, wins, losses, ties, ai_games, ai_wins, ai_ties,
            multiplayer_games, multiplayer_wins, multiplayer_ties
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            data.address,
            data.total_games,
            data.wins,
            data.losses,
            data.ties,
            data.ai_games,
            data.ai_wins,
            data.ai_ties,
            data.multiplayer_games,
            data.multiplayer_wins,
            data.multiplayer_ties,
          ],
        });
      }

      // Execute migration
      await migrateAIMatches();

      // Verify all data is preserved
      for (const expectedData of testData) {
        const result = await turso.execute({
          sql: "SELECT * FROM stats WHERE address = ?",
          args: [expectedData.address],
        });

        expect(result.rows.length).toBe(1);
        const actualData = result.rows[0];

        // Check all original columns are preserved
        expect(actualData.total_games).toBe(expectedData.total_games);
        expect(actualData.wins).toBe(expectedData.wins);
        expect(actualData.losses).toBe(expectedData.losses);
        expect(actualData.ties).toBe(expectedData.ties);
        expect(actualData.ai_games).toBe(expectedData.ai_games);
        expect(actualData.ai_wins).toBe(expectedData.ai_wins);
        expect(actualData.ai_ties).toBe(expectedData.ai_ties);
        expect(actualData.multiplayer_games).toBe(expectedData.multiplayer_games);
        expect(actualData.multiplayer_wins).toBe(expectedData.multiplayer_wins);
        expect(actualData.multiplayer_ties).toBe(expectedData.multiplayer_ties);

        // Check new columns have default values
        expect(actualData.ai_matches_played).toBe(0);
        expect(actualData.ai_matches_won).toBe(0);
        expect(actualData.ai_matches_lost).toBe(0);
        expect(actualData.ai_matches_tied).toBe(0);
        expect(actualData.ai_matches_abandoned).toBe(0);
      }
    });

    it("should handle empty stats table", async () => {
      // Ensure stats table is empty
      await turso.execute("DELETE FROM stats");

      const result = await migrateAIMatches();
      expect(result.success).toBe(true);

      // Verify table structure is correct even with no data
      const tableInfo = await turso.execute(`PRAGMA table_info(stats)`);
      const columns = tableInfo.rows.map(row => row.name as string);

      expect(columns).toContain("ai_matches_played");
      expect(columns).toContain("ai_matches_won");
      expect(columns).toContain("ai_matches_lost");
      expect(columns).toContain("ai_matches_tied");
      expect(columns).toContain("ai_matches_abandoned");
    });
  });
});
