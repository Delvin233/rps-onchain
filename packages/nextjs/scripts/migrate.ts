#!/usr/bin/env tsx

/**
 * Migration CLI Script
 *
 * Usage:
 *   npm run migrate                    # Run all pending migrations
 *   npm run migrate -- --migration 001 # Run specific migration
 *   npm run migrate -- --status       # Show migration status
 *   npm run migrate -- --rollback 001 # Rollback specific migration
 *   npm run migrate -- --verify       # Verify database integrity
 */
import {
  executeAllMigrations,
  executeMigration,
  getMigrationsStatus,
  rollbackMigration,
  verifyDatabaseIntegrity,
} from "../lib/migrations/migrationRunner";

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.includes("--status")) {
      console.log("📊 Getting migration status...\n");
      const status = await getMigrationsStatus();

      console.log(`Total migrations: ${status.totalMigrations}`);
      console.log(`Executed migrations: ${status.executedMigrations}`);
      console.log(`Pending migrations: ${status.pendingMigrations.join(", ") || "None"}`);

      if (status.executedMigrations_list.length > 0) {
        console.log("\n✅ Executed migrations:");
        status.executedMigrations_list.forEach(migration => {
          console.log(`  ${migration.id}: ${migration.name} (${migration.executed_at})`);
          if (migration.affected_rows) {
            console.log(`    Affected rows: ${migration.affected_rows}`);
          }
        });
      }

      if (status.pendingMigrations.length > 0) {
        console.log("\n⏳ Pending migrations:");
        status.pendingMigrations.forEach(id => {
          console.log(`  ${id}`);
        });
      }
    } else if (args.includes("--verify")) {
      console.log("🔍 Verifying database integrity...\n");
      const integrity = await verifyDatabaseIntegrity();

      console.log(`Overall status: ${integrity.success ? "✅ PASSED" : "❌ FAILED"}\n`);

      integrity.checks.forEach(check => {
        const status = check.passed ? "✅" : "❌";
        console.log(`${status} ${check.name}: ${check.message}`);
      });
    } else if (args.includes("--rollback")) {
      const migrationIndex = args.indexOf("--rollback") + 1;
      const migrationId = args[migrationIndex];

      if (!migrationId) {
        console.error("❌ Please specify a migration ID to rollback");
        console.log("Usage: npm run migrate -- --rollback 001");
        process.exit(1);
      }

      console.log(`🔄 Rolling back migration ${migrationId}...\n`);
      const result = await rollbackMigration(migrationId);

      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.error(`❌ ${result.message}`);
        process.exit(1);
      }
    } else if (args.includes("--migration")) {
      const migrationIndex = args.indexOf("--migration") + 1;
      const migrationId = args[migrationIndex];

      if (!migrationId) {
        console.error("❌ Please specify a migration ID to execute");
        console.log("Usage: npm run migrate -- --migration 001");
        process.exit(1);
      }

      console.log(`🚀 Executing migration ${migrationId}...\n`);
      const result = await executeMigration(migrationId);

      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.error(`❌ ${result.message}`);
        process.exit(1);
      }
    } else {
      // Default: run all pending migrations
      console.log("🚀 Running all pending migrations...\n");
      const result = await executeAllMigrations();

      if (result.success) {
        console.log(`\n✅ ${result.message}`);

        if (result.executed.length > 0) {
          console.log(`Executed migrations: ${result.executed.join(", ")}`);
        }
      } else {
        console.error(`\n❌ ${result.message}`);

        if (result.failed.length > 0) {
          console.error(`Failed migrations: ${result.failed.join(", ")}`);
        }

        process.exit(1);
      }
    }
  } catch (error) {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Migration CLI Script

Usage:
  npm run migrate                    # Run all pending migrations
  npm run migrate -- --migration 001 # Run specific migration
  npm run migrate -- --status       # Show migration status
  npm run migrate -- --rollback 001 # Rollback specific migration
  npm run migrate -- --verify       # Verify database integrity
  npm run migrate -- --help         # Show this help

Examples:
  npm run migrate                    # Execute all pending migrations
  npm run migrate -- --status       # Check what migrations have been run
  npm run migrate -- --migration 001 # Run only the AI matches migration
  npm run migrate -- --verify       # Check database integrity after migration
`);
  process.exit(0);
}

main().catch(console.error);
