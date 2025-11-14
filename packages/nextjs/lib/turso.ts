import { createClient } from "@libsql/client";

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize table
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
