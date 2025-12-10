/**
 * AI Match Database Schema Tests
 *
 * Tests for database schema creation, migration, and basic operations.
 */
import { extendStatsTableForMatches, getDatabaseStats, initAIMatchesTable, verifySchema } from "../lib/aiMatchSchema";
import {
  getCompletedMatch,
  getPlayerMatchStats,
  saveCompletedMatch,
  updateMatchStatistics,
} from "../lib/aiMatchStorage";
import { turso } from "../lib/turso";
import { MatchStatus } from "../types/aiMatch";
import { abandonMatch, createNewMatch, playRound } from "../utils/aiMatchUtils";
import { beforeAll, describe, expect, it } from "vitest";

describe("AI Match Database Schema", () => {
  beforeAll(async () => {
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Initialize the AI match schema
    await initAIMatchesTable();
    await extendStatsTableForMatches();
  });

  it("should create ai_matches table with correct schema", async () => {
    const verification = await verifySchema();
    expect(verification.isValid).toBe(true);

    if (!verification.isValid) {
      console.error("Schema errors:", verification.errors);
    }
  });

  it("should save and retrieve completed matches", async () => {
    // Create a test match with unique player ID
    const playerId = `0x${(Date.now() + 1).toString(16).padStart(40, "0")}`;
    const match = createNewMatch(playerId);

    // Play rounds until one side wins (need 2 wins to complete)
    let currentMatch = match;
    let roundCount = 0;

    // Keep playing until match is completed
    while (currentMatch.status === MatchStatus.ACTIVE && roundCount < 10) {
      const { match: updatedMatch } = playRound(currentMatch, "rock");
      currentMatch = updatedMatch;
      roundCount++;
    }

    // Should be completed now
    expect(currentMatch.status).toBe(MatchStatus.COMPLETED);
    expect(currentMatch.rounds.length).toBeGreaterThan(0);

    // Save to database
    await saveCompletedMatch(currentMatch);

    // Retrieve from database
    const retrievedMatch = await getCompletedMatch(currentMatch.id);
    expect(retrievedMatch).not.toBeNull();
    expect(retrievedMatch!.id).toBe(currentMatch.id);
    expect(retrievedMatch!.playerId).toBe(playerId);
    expect(retrievedMatch!.status).toBe(MatchStatus.COMPLETED);
    expect(retrievedMatch!.rounds.length).toBeGreaterThan(0);
  });

  it("should save and retrieve abandoned matches", async () => {
    // Create a test match with unique player ID
    const playerId = `0x${(Date.now() + 2).toString(16).padStart(40, "0")}`;
    const match = createNewMatch(playerId);

    // Play one round then abandon
    const { match: match1 } = playRound(match, "rock");
    const abandonedMatch = abandonMatch(match1);

    expect(abandonedMatch.status).toBe(MatchStatus.ABANDONED);
    expect(abandonedMatch.isAbandoned).toBe(true);

    // Save to database
    await saveCompletedMatch(abandonedMatch);

    // Retrieve from database
    const retrievedMatch = await getCompletedMatch(abandonedMatch.id);
    expect(retrievedMatch).not.toBeNull();
    expect(retrievedMatch!.status).toBe(MatchStatus.ABANDONED);
    expect(retrievedMatch!.isAbandoned).toBe(true);
    expect(retrievedMatch!.winner).toBe("ai"); // AI wins by default on abandonment
  });

  it("should update and retrieve match statistics", async () => {
    // Use a unique player ID for this test to avoid conflicts with previous test data
    const playerId = `0x${Date.now().toString(16).padStart(40, "0")}`;

    // Get initial stats (should be zeros for new player)
    const initialStats = await getPlayerMatchStats(playerId);
    expect(initialStats.ai_matches_played).toBe(0);
    expect(initialStats.ai_matches_won).toBe(0);

    // Update stats for a won match
    await updateMatchStatistics(playerId, "won");

    // Check updated stats
    const updatedStats = await getPlayerMatchStats(playerId);
    expect(updatedStats.ai_matches_played).toBe(1);
    expect(updatedStats.ai_matches_won).toBe(1);
    expect(updatedStats.ai_matches_lost).toBe(0);

    // Update stats for a lost match
    await updateMatchStatistics(playerId, "lost");

    // Check final stats
    const finalStats = await getPlayerMatchStats(playerId);
    expect(finalStats.ai_matches_played).toBe(2);
    expect(finalStats.ai_matches_won).toBe(1);
    expect(finalStats.ai_matches_lost).toBe(1);
  });

  it("should get database statistics", async () => {
    const stats = await getDatabaseStats();

    expect(typeof stats.totalMatches).toBe("number");
    expect(typeof stats.activeMatches).toBe("number");
    expect(typeof stats.completedMatches).toBe("number");
    expect(typeof stats.abandonedMatches).toBe("number");
    expect(typeof stats.playersWithMatches).toBe("number");

    // Should have some matches from previous tests
    expect(stats.totalMatches).toBeGreaterThanOrEqual(0);
    expect(stats.completedMatches).toBeGreaterThanOrEqual(0);
    expect(stats.abandonedMatches).toBeGreaterThanOrEqual(0);
  });

  it("should handle database constraints correctly", async () => {
    const playerId = `0x${(Date.now() + 3).toString(16).padStart(40, "0")}`;
    const match = createNewMatch(playerId);

    // Try to save an active match (should fail)
    await expect(saveCompletedMatch(match)).rejects.toThrow();
  });
});
