import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function POST() {
  try {
    console.log("🚀 Starting database initialization via API...\n");

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Create ai_matches table
    console.log("Creating ai_matches table...");
    await db.execute(`
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

    // Create indexes for ai_matches
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_player_id ON ai_matches(player_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_status ON ai_matches(status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_completed_at ON ai_matches(completed_at DESC)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ai_matches_created_at ON ai_matches(created_at DESC)`);

    // Extend stats table
    console.log("Extending stats table...");
    const columns = [
      "ai_matches_played INTEGER DEFAULT 0",
      "ai_matches_won INTEGER DEFAULT 0",
      "ai_matches_lost INTEGER DEFAULT 0",
      "ai_matches_tied INTEGER DEFAULT 0",
      "ai_matches_abandoned INTEGER DEFAULT 0",
    ];

    for (const column of columns) {
      try {
        await db.execute(`ALTER TABLE stats ADD COLUMN ${column}`);
        console.log(`✅ Added column: ${column.split(" ")[0]}`);
      } catch {
        console.log(`ℹ️ Column ${column.split(" ")[0]} already exists`);
      }
    }

    // Create reward system tables
    console.log("Creating reward system tables...");

    // Seasons/Periods tracking
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reward_seasons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        status TEXT CHECK(status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
        total_rewards REAL DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Reward distributions
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reward_distributions (
        id TEXT PRIMARY KEY,
        season_id TEXT NOT NULL,
        player_address TEXT NOT NULL,
        rank INTEGER NOT NULL,
        reward_amount REAL NOT NULL,
        status TEXT CHECK(status IN ('pending', 'distributed', 'failed')) DEFAULT 'pending',
        distributed_at INTEGER,
        tx_hash TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (season_id) REFERENCES reward_seasons(id)
      )
    `);

    // Campaign management
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reward_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        reward_multiplier REAL DEFAULT 1.0,
        special_rules TEXT,
        status TEXT CHECK(status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Player reward history
    await db.execute(`
      CREATE TABLE IF NOT EXISTS player_reward_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_address TEXT NOT NULL,
        season_id TEXT NOT NULL,
        campaign_id TEXT,
        reward_type TEXT NOT NULL,
        amount REAL NOT NULL,
        earned_at INTEGER DEFAULT (strftime('%s', 'now')),
        claimed_at INTEGER,
        tx_hash TEXT
      )
    `);

    // Treasury tracking
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reward_treasury (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_type TEXT CHECK(transaction_type IN ('deposit', 'withdrawal', 'distribution')) NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        description TEXT,
        tx_hash TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create reward indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_reward_distributions_season ON reward_distributions(season_id)`);
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_reward_distributions_player ON reward_distributions(player_address)`,
    );
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_reward_distributions_status ON reward_distributions(status)`);
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_player_reward_history_player ON player_reward_history(player_address)`,
    );
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_player_reward_history_season ON player_reward_history(season_id)`);

    // Initialize current season
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    const seasonId = `${year}-W${week.toString().padStart(2, "0")}`;

    const { startDate, endDate } = getSeasonDates(seasonId);

    await db.execute({
      sql: `INSERT OR IGNORE INTO reward_seasons (id, name, start_date, end_date, status) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        seasonId,
        `Week ${week} ${year}`,
        Math.floor(startDate.getTime() / 1000),
        Math.floor(endDate.getTime() / 1000),
        "active",
      ],
    });

    // Initialize existing users with default values
    console.log("Initializing existing user stats...");
    const result = await db.execute(`
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

    console.log("🎉 Database initialization completed successfully!");

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      details: {
        tablesCreated: [
          "ai_matches",
          "reward_seasons",
          "reward_distributions",
          "reward_campaigns",
          "player_reward_history",
          "reward_treasury",
        ],
        currentSeason: seasonId,
        usersUpdated: result.rowsAffected || 0,
      },
    });
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getSeasonDates(seasonId: string): { startDate: Date; endDate: Date } {
  const [year, weekStr] = seasonId.split("-W");
  const week = parseInt(weekStr);

  const startDate = new Date(parseInt(year), 0, 1 + (week - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}
