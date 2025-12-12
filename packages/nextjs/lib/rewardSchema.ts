// Database schema for reward distribution system

export const REWARD_TABLES_SQL = `
-- Seasons/Periods tracking
CREATE TABLE IF NOT EXISTS reward_seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date INTEGER NOT NULL, -- Unix timestamp
  end_date INTEGER NOT NULL,   -- Unix timestamp
  status TEXT CHECK(status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
  total_rewards REAL DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Reward distributions
CREATE TABLE IF NOT EXISTS reward_distributions (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  player_address TEXT NOT NULL,
  rank INTEGER NOT NULL,
  reward_amount REAL NOT NULL,
  status TEXT CHECK(status IN ('pending', 'distributed', 'failed')) DEFAULT 'pending',
  distributed_at INTEGER, -- Unix timestamp
  tx_hash TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (season_id) REFERENCES reward_seasons(id)
);

-- Campaign management
CREATE TABLE IF NOT EXISTS reward_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  reward_multiplier REAL DEFAULT 1.0,
  special_rules TEXT, -- JSON string
  status TEXT CHECK(status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Player reward history
CREATE TABLE IF NOT EXISTS player_reward_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_address TEXT NOT NULL,
  season_id TEXT NOT NULL,
  campaign_id TEXT,
  reward_type TEXT NOT NULL, -- 'weekly', 'campaign', 'bonus'
  amount REAL NOT NULL,
  earned_at INTEGER DEFAULT (strftime('%s', 'now')),
  claimed_at INTEGER,
  tx_hash TEXT
);

-- Treasury tracking
CREATE TABLE IF NOT EXISTS reward_treasury (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_type TEXT CHECK(transaction_type IN ('deposit', 'withdrawal', 'distribution')) NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  description TEXT,
  tx_hash TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reward_distributions_season ON reward_distributions(season_id);
CREATE INDEX IF NOT EXISTS idx_reward_distributions_player ON reward_distributions(player_address);
CREATE INDEX IF NOT EXISTS idx_reward_distributions_status ON reward_distributions(status);
CREATE INDEX IF NOT EXISTS idx_player_reward_history_player ON player_reward_history(player_address);
CREATE INDEX IF NOT EXISTS idx_player_reward_history_season ON player_reward_history(season_id);
`;

export async function initializeRewardTables(db: any) {
  try {
    await db.execute(REWARD_TABLES_SQL);
    console.log("✅ Reward system tables initialized successfully");

    // Insert current season if it doesn't exist
    const currentSeasonId = getCurrentSeasonId();
    const { startDate, endDate } = getSeasonDates(currentSeasonId);

    await db.execute({
      sql: `INSERT OR IGNORE INTO reward_seasons (id, name, start_date, end_date, status) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        currentSeasonId,
        `Week ${currentSeasonId.split("-W")[1]} ${currentSeasonId.split("-W")[0]}`,
        Math.floor(startDate.getTime() / 1000),
        Math.floor(endDate.getTime() / 1000),
        "active",
      ],
    });

    console.log(`✅ Current season ${currentSeasonId} initialized`);
  } catch (error) {
    console.error("❌ Failed to initialize reward tables:", error);
    throw error;
  }
}

function getCurrentSeasonId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  return `${year}-W${week.toString().padStart(2, "0")}`;
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
