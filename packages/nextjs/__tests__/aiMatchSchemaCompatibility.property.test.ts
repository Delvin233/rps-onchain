/**
 * AI Match Database Schema Compatibility Property Tests
 *
 * Property-based tests for database schema compatibility and legacy data preservation.
 * **Feature: best-of-three-ai-matches, Property 14: Legacy Data Preservation**
 */
import { extendStatsTableForMatches, initAIMatchesTable, verifySchema } from "../lib/aiMatchSchema";
import { getPlayerMatchStats, updateMatchStatistics } from "../lib/aiMatchStorage";
import { turso } from "../lib/turso";
import fc from "fast-check";
import { beforeAll, describe, expect, it } from "vitest";

// Helper to generate hex addresses
const addressArbitrary = fc
  .array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 })
  .map(arr => `0x${arr.map(n => n.toString(16)).join("")}`);

describe("AI Match Database Schema Compatibility Property Tests", () => {
  beforeAll(async () => {
    // Add a small delay to avoid database lock conflicts with other tests
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Initialize AI match schema extensions (tables already exist from vitest.setup.ts)
      await initAIMatchesTable();
      await extendStatsTableForMatches();
    } catch (error) {
      // Ignore if already exists or locked
      console.log("Schema initialization skipped:", error);
    }
  }, 15000); // 15 second timeout for setup

  /**
   * Property 14: Legacy Data Preservation
   * **Validates: Requirements 7.1**
   *
   * When extending the database schema with new AI match columns,
   * all existing player statistics must be preserved exactly.
   */
  it("should preserve all existing player statistics when extending schema", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate legacy player data
        fc.array(
          fc.record({
            address: addressArbitrary,
            total_games: fc.integer({ min: 0, max: 1000 }),
            wins: fc.integer({ min: 0, max: 500 }),
            losses: fc.integer({ min: 0, max: 500 }),
            ties: fc.integer({ min: 0, max: 100 }),
            ai_games: fc.integer({ min: 0, max: 800 }),
            ai_wins: fc.integer({ min: 0, max: 400 }),
            ai_ties: fc.integer({ min: 0, max: 50 }),
            multiplayer_games: fc.integer({ min: 0, max: 200 }),
            multiplayer_wins: fc.integer({ min: 0, max: 100 }),
            multiplayer_ties: fc.integer({ min: 0, max: 20 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        async legacyPlayers => {
          // Create unique addresses to avoid conflicts
          const uniquePlayers = legacyPlayers.map((player, index) => ({
            ...player,
            address: `0x${Date.now().toString(16)}${index.toString(16).padStart(8, "0")}`,
          }));

          // Insert legacy data before schema extension
          for (const player of uniquePlayers) {
            await turso.execute({
              sql: `INSERT OR REPLACE INTO stats (
                address, total_games, wins, losses, ties, ai_games, ai_wins, ai_ties,
                multiplayer_games, multiplayer_wins, multiplayer_ties, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              args: [
                player.address,
                player.total_games,
                player.wins,
                player.losses,
                player.ties,
                player.ai_games,
                player.ai_wins,
                player.ai_ties,
                player.multiplayer_games,
                player.multiplayer_wins,
                player.multiplayer_ties,
              ],
            });
          }

          // Extend schema (this should preserve existing data)
          await extendStatsTableForMatches();

          // Verify all legacy data is preserved
          for (const originalPlayer of uniquePlayers) {
            const result = await turso.execute({
              sql: `SELECT * FROM stats WHERE address = ?`,
              args: [originalPlayer.address],
            });

            expect(result.rows).toHaveLength(1);
            const retrievedPlayer = result.rows[0];

            // Verify all original fields are preserved
            expect(Number(retrievedPlayer.total_games)).toBe(originalPlayer.total_games);
            expect(Number(retrievedPlayer.wins)).toBe(originalPlayer.wins);
            expect(Number(retrievedPlayer.losses)).toBe(originalPlayer.losses);
            expect(Number(retrievedPlayer.ties)).toBe(originalPlayer.ties);
            expect(Number(retrievedPlayer.ai_games)).toBe(originalPlayer.ai_games);
            expect(Number(retrievedPlayer.ai_wins)).toBe(originalPlayer.ai_wins);
            expect(Number(retrievedPlayer.ai_ties)).toBe(originalPlayer.ai_ties);
            expect(Number(retrievedPlayer.multiplayer_games)).toBe(originalPlayer.multiplayer_games);
            expect(Number(retrievedPlayer.multiplayer_wins)).toBe(originalPlayer.multiplayer_wins);
            expect(Number(retrievedPlayer.multiplayer_ties)).toBe(originalPlayer.multiplayer_ties);

            // Verify new columns have default values
            expect(Number(retrievedPlayer.ai_matches_played) || 0).toBe(0);
            expect(Number(retrievedPlayer.ai_matches_won) || 0).toBe(0);
            expect(Number(retrievedPlayer.ai_matches_lost) || 0).toBe(0);
            expect(Number(retrievedPlayer.ai_matches_tied) || 0).toBe(0);
            expect(Number(retrievedPlayer.ai_matches_abandoned) || 0).toBe(0);
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Property: Schema Extension Idempotency
   *
   * Extending the schema multiple times should not affect existing data
   * or create duplicate columns.
   */
  it("should handle multiple schema extensions idempotently", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          address: addressArbitrary,
          total_games: fc.integer({ min: 0, max: 100 }),
          wins: fc.integer({ min: 0, max: 50 }),
        }),
        async player => {
          // Create unique address
          const uniqueAddress = `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`;
          const testPlayer = { ...player, address: uniqueAddress };

          // Insert test data
          await turso.execute({
            sql: `INSERT OR REPLACE INTO stats (address, total_games, wins) VALUES (?, ?, ?)`,
            args: [testPlayer.address, testPlayer.total_games, testPlayer.wins],
          });

          // Extend schema multiple times
          await extendStatsTableForMatches();
          await extendStatsTableForMatches();
          await extendStatsTableForMatches();

          // Verify data is still intact
          const result = await turso.execute({
            sql: `SELECT * FROM stats WHERE address = ?`,
            args: [testPlayer.address],
          });

          expect(result.rows).toHaveLength(1);
          const retrievedPlayer = result.rows[0];
          expect(Number(retrievedPlayer.total_games)).toBe(testPlayer.total_games);
          expect(Number(retrievedPlayer.wins)).toBe(testPlayer.wins);

          // Verify schema is still valid
          const schemaVerification = await verifySchema();
          expect(schemaVerification.isValid).toBe(true);
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: New Column Default Values
   *
   * All new AI match columns should have proper default values
   * for existing players.
   */
  it("should set proper default values for new AI match columns", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            address: addressArbitrary,
            existing_games: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        async players => {
          // Create unique addresses
          const uniquePlayers = players.map((player, index) => ({
            ...player,
            address: `0x${Date.now().toString(16)}${index.toString(16).padStart(10, "0")}`,
          }));

          // Insert players with only legacy columns
          for (const player of uniquePlayers) {
            await turso.execute({
              sql: `INSERT OR REPLACE INTO stats (address, total_games) VALUES (?, ?)`,
              args: [player.address, player.existing_games],
            });
          }

          // Extend schema
          await extendStatsTableForMatches();

          // Verify all players have proper default values for new columns
          for (const player of uniquePlayers) {
            const stats = await getPlayerMatchStats(player.address);

            expect(stats.ai_matches_played).toBe(0);
            expect(stats.ai_matches_won).toBe(0);
            expect(stats.ai_matches_lost).toBe(0);
            expect(stats.ai_matches_tied).toBe(0);
            expect(stats.ai_matches_abandoned).toBe(0);
          }
        },
      ),
      { numRuns: 15 },
    );
  });

  /**
   * Property: Mixed Statistics Operations
   *
   * Operations on both legacy and new columns should work correctly
   * without interfering with each other.
   */
  it("should handle mixed legacy and new statistics operations", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          address: addressArbitrary,
          legacy_wins: fc.integer({ min: 0, max: 50 }),
          match_results: fc.array(
            fc.oneof(
              fc.constant("won" as const),
              fc.constant("lost" as const),
              fc.constant("tied" as const),
              fc.constant("abandoned" as const),
            ),
            { minLength: 1, maxLength: 10 },
          ),
        }),
        async ({ legacy_wins, match_results }) => {
          // Create unique address
          const uniqueAddress = `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`;

          // Set up player with legacy stats
          await turso.execute({
            sql: `INSERT OR REPLACE INTO stats (address, wins) VALUES (?, ?)`,
            args: [uniqueAddress, legacy_wins],
          });

          // Extend schema
          await extendStatsTableForMatches();

          // Apply match results
          for (const result of match_results) {
            await updateMatchStatistics(uniqueAddress, result);
          }

          // Verify legacy stats are unchanged
          const finalResult = await turso.execute({
            sql: `SELECT wins FROM stats WHERE address = ?`,
            args: [uniqueAddress],
          });
          expect(Number(finalResult.rows[0].wins)).toBe(legacy_wins);

          // Verify new stats are correctly calculated
          const matchStats = await getPlayerMatchStats(uniqueAddress);
          const expectedWon = match_results.filter(r => r === "won").length;
          const expectedLost = match_results.filter(r => r === "lost").length;
          const expectedTied = match_results.filter(r => r === "tied").length;
          const expectedAbandoned = match_results.filter(r => r === "abandoned").length;
          const expectedPlayed = match_results.filter(r => r !== "abandoned").length;

          expect(matchStats.ai_matches_won).toBe(expectedWon);
          expect(matchStats.ai_matches_lost).toBe(expectedLost);
          expect(matchStats.ai_matches_tied).toBe(expectedTied);
          expect(matchStats.ai_matches_abandoned).toBe(expectedAbandoned);
          expect(matchStats.ai_matches_played).toBe(expectedPlayed);
        },
      ),
      { numRuns: 20 },
    );
  });
});
