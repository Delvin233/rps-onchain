/**
 * One-time script to normalize all addresses in the database to lowercase
 * Run this once to fix existing data, then all new data will be stored lowercase
 */
import { turso } from "../lib/turso";

async function normalizeAddresses() {
  console.log("🔄 Starting address normalization...");

  try {
    // Normalize addresses in matches table
    console.log("📝 Normalizing matches table...");
    await turso.execute({
      sql: `UPDATE matches SET 
        player1 = LOWER(player1),
        player2 = LOWER(player2),
        winner = CASE WHEN winner IS NOT NULL THEN LOWER(winner) ELSE NULL END
      WHERE player1 != LOWER(player1) OR player2 != LOWER(player2) OR (winner IS NOT NULL AND winner != LOWER(winner))`,
    });

    // Normalize addresses in stats table
    console.log("📊 Normalizing stats table...");
    await turso.execute({
      sql: `UPDATE stats SET address = LOWER(address) WHERE address != LOWER(address)`,
    });

    // Normalize addresses in ai_matches table
    console.log("🤖 Normalizing ai_matches table...");
    await turso.execute({
      sql: `UPDATE ai_matches SET player_id = LOWER(player_id) WHERE player_id != LOWER(player_id)`,
    });

    // Normalize addresses in ai_leaderboards table
    console.log("🏆 Normalizing ai_leaderboards table...");
    await turso.execute({
      sql: `UPDATE ai_leaderboards SET address = LOWER(address) WHERE address != LOWER(address)`,
    });

    console.log("✅ Address normalization completed!");

    // Show some stats
    const matchesCount = await turso.execute({ sql: "SELECT COUNT(*) as count FROM matches" });
    const statsCount = await turso.execute({ sql: "SELECT COUNT(*) as count FROM stats" });
    const aiMatchesCount = await turso.execute({ sql: "SELECT COUNT(*) as count FROM ai_matches" });

    console.log(`📈 Updated records:
    - Matches: ${matchesCount.rows[0].count}
    - Stats: ${statsCount.rows[0].count}  
    - AI Matches: ${aiMatchesCount.rows[0].count}`);
  } catch (error) {
    console.error("❌ Error normalizing addresses:", error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  normalizeAddresses()
    .then(() => {
      console.log("🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { normalizeAddresses };
