#!/usr/bin/env tsx

/**
 * AI Match Database Migration Script
 *
 * This script migrates the database to support best-of-three AI matches.
 * It can be run independently or as part of the deployment process.
 *
 * Usage:
 *   npx tsx scripts/migrate-ai-matches.ts
 *   npx tsx scripts/migrate-ai-matches.ts --rollback
 *   npx tsx scripts/migrate-ai-matches.ts --verify
 */
import { getDatabaseStats, migrateExistingData, rollbackMigration, verifySchema } from "../lib/aiMatchSchema";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🚀 AI Match Database Migration Tool");
  console.log("=====================================");

  try {
    switch (command) {
      case "--rollback":
        console.log("📦 Rolling back AI match database changes...");
        await rollbackMigration();
        console.log("✅ Rollback completed successfully");
        break;

      case "--verify":
        console.log("🔍 Verifying database schema...");
        const verification = await verifySchema();

        if (verification.isValid) {
          console.log("✅ Database schema is valid");

          // Show database stats
          const stats = await getDatabaseStats();
          console.log("\n📊 Database Statistics:");
          console.log(`  Total AI Matches: ${stats.totalMatches}`);
          console.log(`  Active Matches: ${stats.activeMatches}`);
          console.log(`  Completed Matches: ${stats.completedMatches}`);
          console.log(`  Abandoned Matches: ${stats.abandonedMatches}`);
          console.log(`  Players with Matches: ${stats.playersWithMatches}`);
        } else {
          console.log("❌ Database schema validation failed:");
          verification.errors.forEach(error => console.log(`  - ${error}`));
          process.exit(1);
        }
        break;

      case "--help":
      case "-h":
        console.log("Available commands:");
        console.log("  (no args)    - Run migration");
        console.log("  --rollback   - Rollback migration");
        console.log("  --verify     - Verify schema");
        console.log("  --help       - Show this help");
        break;

      default:
        console.log("🔄 Running AI match database migration...");
        await migrateExistingData();

        // Verify the migration
        console.log("🔍 Verifying migration...");
        const postMigrationVerification = await verifySchema();

        if (postMigrationVerification.isValid) {
          console.log("✅ Migration completed and verified successfully");

          // Show database stats
          const stats = await getDatabaseStats();
          console.log("\n📊 Post-Migration Database Statistics:");
          console.log(`  Total AI Matches: ${stats.totalMatches}`);
          console.log(`  Active Matches: ${stats.activeMatches}`);
          console.log(`  Completed Matches: ${stats.completedMatches}`);
          console.log(`  Abandoned Matches: ${stats.abandonedMatches}`);
          console.log(`  Players with Matches: ${stats.playersWithMatches}`);
        } else {
          console.log("❌ Migration verification failed:");
          postMigrationVerification.errors.forEach(error => console.log(`  - ${error}`));
          process.exit(1);
        }
        break;
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the migration
main().catch(error => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
