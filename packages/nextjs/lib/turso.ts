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
}
