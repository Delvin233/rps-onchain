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

export async function initAllTables() {
  await initBlockchainProofsTable();
  await initUserPreferencesTable();
  await initVerificationsTable();
  await initUsersTable();
  await initStatsTable();
  await initMatchesTable();
}
