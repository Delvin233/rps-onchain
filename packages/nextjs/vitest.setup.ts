import { turso } from "./lib/turso";
import "@testing-library/jest-dom";
import { beforeAll, vi } from "vitest";

// Global Redis mock to prevent connection attempts during tests
vi.mock("redis", () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    setEx: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    exists: vi.fn().mockResolvedValue(0),
    multi: vi.fn(() => ({
      del: vi.fn(),
      exec: vi.fn().mockResolvedValue([]),
    })),
    sendCommand: vi.fn().mockResolvedValue(0),
    isReady: true,
    on: vi.fn(),
    off: vi.fn(),
    lPush: vi.fn().mockResolvedValue(1),
    lTrim: vi.fn().mockResolvedValue("OK"),
    lRange: vi.fn().mockResolvedValue([]),
    hSet: vi.fn().mockResolvedValue(1),
    hGet: vi.fn().mockResolvedValue(null),
    hGetAll: vi.fn().mockResolvedValue({}),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  })),
}));

// Initialize database tables once for all tests
beforeAll(async () => {
  try {
    // Initialize all required tables for testing
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
        ai_matches_played INTEGER DEFAULT 0,
        ai_matches_won INTEGER DEFAULT 0,
        ai_matches_lost INTEGER DEFAULT 0,
        ai_matches_tied INTEGER DEFAULT 0,
        ai_matches_abandoned INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS ai_matches (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        status TEXT NOT NULL,
        player_score INTEGER NOT NULL,
        ai_score INTEGER NOT NULL,
        current_round INTEGER NOT NULL,
        rounds_data TEXT NOT NULL,
        started_at TEXT NOT NULL,
        last_activity_at TEXT NOT NULL,
        completed_at TEXT,
        winner TEXT,
        is_abandoned BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        player1 TEXT NOT NULL,
        player2 TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        current_round INTEGER DEFAULT 1,
        player1_score INTEGER DEFAULT 0,
        player2_score INTEGER DEFAULT 0,
        rounds TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )
    `);

    console.log("[Test Setup] Database tables initialized");
  } catch (error) {
    console.warn("[Test Setup] Database initialization failed:", error);
  }
});
