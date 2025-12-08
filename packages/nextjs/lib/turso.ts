import { createClient } from "@libsql/client";

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize tables
export async function initBlockchainProofsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS blockchain_proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_key TEXT UNIQUE NOT NULL,
      room_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      chain_id TEXT NOT NULL,
      timestamp_ms INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function initUserPreferencesTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_address TEXT UNIQUE NOT NULL,
      color_theme TEXT DEFAULT 'delvin233',
      font_theme TEXT DEFAULT 'futuristic',
      spacing_scale TEXT DEFAULT 'comfortable',
      font_size_override INTEGER DEFAULT 100,
      crt_effect INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add missing columns if they don't exist
  try {
    await turso.execute(`ALTER TABLE user_preferences ADD COLUMN color_theme TEXT DEFAULT 'delvin233'`);
  } catch {
    // Column already exists, ignore
  }
  try {
    await turso.execute(`ALTER TABLE user_preferences ADD COLUMN font_theme TEXT DEFAULT 'futuristic'`);
  } catch {
    // Column already exists, ignore
  }
  try {
    await turso.execute(`ALTER TABLE user_preferences ADD COLUMN spacing_scale TEXT DEFAULT 'comfortable'`);
  } catch {
    // Column already exists, ignore
  }
  try {
    await turso.execute(`ALTER TABLE user_preferences ADD COLUMN font_size_override INTEGER DEFAULT 100`);
  } catch {
    // Column already exists, ignore
  }
  try {
    await turso.execute(`ALTER TABLE user_preferences ADD COLUMN crt_effect INTEGER DEFAULT 0`);
  } catch {
    // Column already exists, ignore
  }
}

export async function initVerificationsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      verified BOOLEAN DEFAULT 1,
      proof_data TEXT,
      timestamp_ms INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function initUsersTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      address TEXT PRIMARY KEY,
      username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function initStatsTable() {
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

  // Add new columns if they don't exist (migration)
  try {
    await turso.execute(`ALTER TABLE stats ADD COLUMN ai_ties INTEGER DEFAULT 0`);
  } catch {}
  try {
    await turso.execute(`ALTER TABLE stats ADD COLUMN multiplayer_ties INTEGER DEFAULT 0`);
  } catch {}
}

export async function initMatchesTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      player1 TEXT NOT NULL,
      player2 TEXT NOT NULL,
      player1_move TEXT NOT NULL,
      player2_move TEXT NOT NULL,
      winner TEXT,
      game_mode TEXT NOT NULL,
      timestamp_ms INTEGER NOT NULL,
      ipfs_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_matches_timestamp ON matches(timestamp_ms DESC)`);
}

export async function initAILeaderboardsTable() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS ai_leaderboards (
      address TEXT PRIMARY KEY,
      wins INTEGER NOT NULL DEFAULT 0,
      rank TEXT NOT NULL,
      display_name TEXT,
      updated_at INTEGER NOT NULL
    )
  `);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_wins ON ai_leaderboards(wins DESC)`);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_rank ON ai_leaderboards(rank)`);
}

export async function initAllTables() {
  await initBlockchainProofsTable();
  await initUserPreferencesTable();
  await initVerificationsTable();
  await initUsersTable();
  await initStatsTable();
  await initMatchesTable();
  await initAILeaderboardsTable();
}

// ============================================
// AI Leaderboard Database Utilities
// ============================================

export interface LeaderboardEntry {
  address: string;
  wins: number;
  rank: string;
  display_name: string | null;
  updated_at: number;
}

export interface PlayerRankData {
  address: string;
  wins: number;
  rank: string;
  display_name: string | null;
  position: number;
  updated_at: number;
}

/**
 * Get a player's rank data from the leaderboard
 * @param address - Player's wallet address (lowercase)
 * @returns Player rank data or null if not found
 */
export async function getPlayerRank(address: string): Promise<LeaderboardEntry | null> {
  try {
    const result = await turso.execute({
      sql: "SELECT * FROM ai_leaderboards WHERE address = ?",
      args: [address.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      address: row.address as string,
      wins: Number(row.wins),
      rank: row.rank as string,
      display_name: row.display_name as string | null,
      updated_at: Number(row.updated_at),
    };
  } catch (error) {
    console.error("[Leaderboard] Error getting player rank:", error);
    throw error;
  }
}

/**
 * Update a player's wins and rank in the leaderboard
 * @param address - Player's wallet address (lowercase)
 * @param wins - New total wins
 * @param rank - New rank name
 * @param displayName - Optional display name (ENS/Basename/Farcaster)
 * @returns Updated player data
 */
export async function updatePlayerWins(
  address: string,
  wins: number,
  rank: string,
  displayName?: string | null,
): Promise<LeaderboardEntry> {
  try {
    const now = Date.now();
    const lowerAddress = address.toLowerCase();

    // Check if player exists
    const existing = await getPlayerRank(lowerAddress);

    if (existing) {
      // Update existing player
      await turso.execute({
        sql: `UPDATE ai_leaderboards 
              SET wins = ?, rank = ?, display_name = ?, updated_at = ?
              WHERE address = ?`,
        args: [wins, rank, displayName ?? existing.display_name ?? null, now, lowerAddress],
      });
    } else {
      // Insert new player
      await turso.execute({
        sql: `INSERT INTO ai_leaderboards (address, wins, rank, display_name, updated_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [lowerAddress, wins, rank, displayName ?? null, now],
      });
    }

    // Return updated data
    const updated = await getPlayerRank(lowerAddress);
    if (!updated) {
      throw new Error("Failed to retrieve updated player data");
    }

    return updated;
  } catch (error) {
    console.error("[Leaderboard] Error updating player wins:", error);
    throw error;
  }
}

/**
 * Get the leaderboard with pagination
 * @param limit - Number of entries to return (max 100)
 * @param offset - Number of entries to skip
 * @returns Array of leaderboard entries and total count
 */
export async function getLeaderboard(
  limit: number = 50,
  offset: number = 0,
): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  try {
    // Enforce max limit
    const safeLimit = Math.min(limit, 100);

    // Get total count
    const countResult = await turso.execute("SELECT COUNT(*) as count FROM ai_leaderboards");
    const total = Number(countResult.rows[0].count);

    // Get paginated entries
    const result = await turso.execute({
      sql: "SELECT * FROM ai_leaderboards ORDER BY wins DESC LIMIT ? OFFSET ?",
      args: [safeLimit, offset],
    });

    const entries: LeaderboardEntry[] = result.rows.map(row => ({
      address: row.address as string,
      wins: Number(row.wins),
      rank: row.rank as string,
      display_name: row.display_name as string | null,
      updated_at: Number(row.updated_at),
    }));

    return { entries, total };
  } catch (error) {
    console.error("[Leaderboard] Error getting leaderboard:", error);
    throw error;
  }
}

/**
 * Get a player's position on the leaderboard
 * @param address - Player's wallet address (lowercase)
 * @returns Position (1-indexed) or 0 if not found
 */
export async function getPlayerPosition(address: string): Promise<number> {
  try {
    const player = await getPlayerRank(address.toLowerCase());
    if (!player) {
      return 0;
    }

    // Count players with more wins
    const result = await turso.execute({
      sql: "SELECT COUNT(*) as count FROM ai_leaderboards WHERE wins > ?",
      args: [player.wins],
    });

    const position = Number(result.rows[0].count) + 1;
    return position;
  } catch (error) {
    console.error("[Leaderboard] Error getting player position:", error);
    throw error;
  }
}

/**
 * Get all players from the leaderboard
 * @returns Array of all leaderboard entries
 */
export async function getAllPlayers(): Promise<LeaderboardEntry[]> {
  try {
    const result = await turso.execute("SELECT * FROM ai_leaderboards ORDER BY wins DESC");

    const entries: LeaderboardEntry[] = result.rows.map(row => ({
      address: row.address as string,
      wins: Number(row.wins),
      rank: row.rank as string,
      display_name: row.display_name as string | null,
      updated_at: Number(row.updated_at),
    }));

    return entries;
  } catch (error) {
    console.error("[Leaderboard] Error getting all players:", error);
    throw error;
  }
}

/**
 * Update a player's display name
 * @param address - Player's wallet address (lowercase)
 * @param displayName - New display name
 */
export async function updatePlayerDisplayName(address: string, displayName: string): Promise<void> {
  try {
    const lowerAddress = address.toLowerCase();
    const now = Date.now();

    await turso.execute({
      sql: "UPDATE ai_leaderboards SET display_name = ?, updated_at = ? WHERE address = ?",
      args: [displayName, now, lowerAddress],
    });
  } catch (error) {
    console.error("[Leaderboard] Error updating player display name:", error);
    throw error;
  }
}
