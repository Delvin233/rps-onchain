import { CACHE_DURATIONS, CACHE_PREFIXES, cacheManager } from "./cache-manager";
import { circuitBreakers } from "./circuit-breaker";
import { withDatabase } from "./database-pool";
import { withRetry } from "./retry-logic";

// Type definitions for resilient database operations
export interface ResilientStats {
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  ai_games: number;
  ai_wins: number;
  ai_ties: number;
  multiplayer_games: number;
  multiplayer_wins: number;
  multiplayer_ties: number;
  // Match-level statistics for AI matches
  ai_matches_played: number;
  ai_matches_won: number;
  ai_matches_lost: number;
  ai_matches_tied: number;
  ai_matches_abandoned: number;
}

// Resilient database operations with circuit breaker, retry, and fallback
export class ResilientDatabase {
  // Get stats with full resilience
  static async getStats(address: string) {
    const cacheKey = address.toLowerCase();

    return circuitBreakers.database.execute(
      // Primary operation: Get from database with retry
      async () => {
        return withRetry(async () => {
          return withDatabase(async client => {
            const result = await client.execute({
              sql: "SELECT * FROM stats WHERE address = ?",
              args: [address.toLowerCase()],
            });

            if (result.rows.length === 0) {
              return null;
            }

            const row = result.rows[0];
            const stats = {
              totalGames: Number(row.total_games || 0),
              wins: Number(row.wins || 0),
              losses: Number(row.losses || 0),
              ties: Number(row.ties || 0),
              ai_games: Number(row.ai_games || 0),
              ai_wins: Number(row.ai_wins || 0),
              ai_ties: Number(row.ai_ties || 0),
              multiplayer_games: Number(row.multiplayer_games || 0),
              multiplayer_wins: Number(row.multiplayer_wins || 0),
              multiplayer_ties: Number(row.multiplayer_ties || 0),
              // Match-level statistics
              ai_matches_played: Number(row.ai_matches_played || 0),
              ai_matches_won: Number(row.ai_matches_won || 0),
              ai_matches_lost: Number(row.ai_matches_lost || 0),
              ai_matches_tied: Number(row.ai_matches_tied || 0),
              ai_matches_abandoned: Number(row.ai_matches_abandoned || 0),
            };

            // Cache successful result
            await cacheManager.set(cacheKey, stats, {
              prefix: CACHE_PREFIXES.STATS,
              ttl: CACHE_DURATIONS.STATS,
            });

            return stats;
          });
        });
      },

      // Fallback operation: Get from cache or return defaults
      async () => {
        console.warn(`[ResilientDB] Database unavailable, trying cache for stats: ${address}`);

        // Try cache first with error handling for corrupted cache entries
        try {
          const cached = await cacheManager.get(cacheKey, {
            prefix: CACHE_PREFIXES.STATS,
          });

          if (cached && typeof cached === "object" && (cached as any).totalGames !== undefined) {
            console.info(`[ResilientDB] Serving cached stats for: ${address}`);
            return cached;
          } else if (cached) {
            // Invalid cache format, clear it
            console.warn(`[ResilientDB] Invalid cache format for ${address}, clearing...`);
            await cacheManager.invalidate(cacheKey, {
              prefix: CACHE_PREFIXES.STATS,
            });
          }
        } catch (error) {
          console.warn(`[ResilientDB] Cache error for ${address}, clearing:`, error);
          // Clear corrupted cache entry
          await cacheManager.invalidate(cacheKey, {
            prefix: CACHE_PREFIXES.STATS,
          });
        }

        // Return empty stats as last resort
        console.warn(`[ResilientDB] No cache available, returning empty stats for: ${address}`);
        return {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          ai_games: 0,
          ai_wins: 0,
          ai_ties: 0,
          multiplayer_games: 0,
          multiplayer_wins: 0,
          multiplayer_ties: 0,
          // Match-level statistics
          ai_matches_played: 0,
          ai_matches_won: 0,
          ai_matches_lost: 0,
          ai_matches_tied: 0,
          ai_matches_abandoned: 0,
        };
      },
    );
  }

  // Update stats with resilience
  static async updateStats(address: string, isWin: boolean, isTie: boolean, isAI: boolean) {
    const addressLower = address.toLowerCase();

    return circuitBreakers.database.execute(
      // Primary operation: Update database with retry
      async () => {
        return withRetry(async () => {
          return withDatabase(async client => {
            // Get current stats first
            const current = await client.execute({
              sql: "SELECT * FROM stats WHERE address = ?",
              args: [addressLower],
            });

            let sql: string;
            let args: any[];

            if (current.rows.length === 0) {
              // Insert new record
              sql = `INSERT INTO stats (
                address, total_games, wins, losses, ties, 
                ai_games, ai_wins, ai_ties, 
                multiplayer_games, multiplayer_wins, multiplayer_ties
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

              args = [
                addressLower,
                1, // total_games
                isWin ? 1 : 0, // wins
                !isWin && !isTie ? 1 : 0, // losses
                isTie ? 1 : 0, // ties
                isAI ? 1 : 0, // ai_games
                isAI && isWin ? 1 : 0, // ai_wins
                isAI && isTie ? 1 : 0, // ai_ties
                !isAI ? 1 : 0, // multiplayer_games
                !isAI && isWin ? 1 : 0, // multiplayer_wins
                !isAI && isTie ? 1 : 0, // multiplayer_ties
              ];
            } else {
              // Update existing record
              sql = `UPDATE stats SET 
                total_games = total_games + 1,
                wins = wins + ?,
                losses = losses + ?,
                ties = ties + ?,
                ai_games = ai_games + ?,
                ai_wins = ai_wins + ?,
                ai_ties = ai_ties + ?,
                multiplayer_games = multiplayer_games + ?,
                multiplayer_wins = multiplayer_wins + ?,
                multiplayer_ties = multiplayer_ties + ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE address = ?`;

              args = [
                isWin ? 1 : 0, // wins
                !isWin && !isTie ? 1 : 0, // losses
                isTie ? 1 : 0, // ties
                isAI ? 1 : 0, // ai_games
                isAI && isWin ? 1 : 0, // ai_wins
                isAI && isTie ? 1 : 0, // ai_ties
                !isAI ? 1 : 0, // multiplayer_games
                !isAI && isWin ? 1 : 0, // multiplayer_wins
                !isAI && isTie ? 1 : 0, // multiplayer_ties
                addressLower,
              ];
            }

            await client.execute({ sql, args });

            // Invalidate cache after successful update
            await cacheManager.invalidate(addressLower, {
              prefix: CACHE_PREFIXES.STATS,
            });

            return true;
          });
        });
      },

      // Fallback operation: Log failure but don't crash
      async () => {
        console.error(`[ResilientDB] Failed to update stats for ${address}, database unavailable`);
        // Could implement a queue here to retry later
        return false;
      },
    );
  }

  // Get leaderboard with resilience
  static async getLeaderboard(limit: number = 50, offset: number = 0) {
    const cacheKey = `leaderboard:${limit}:${offset}`;

    return circuitBreakers.database.execute(
      // Primary operation
      async () => {
        return withRetry(async () => {
          return withDatabase(async client => {
            const result = await client.execute({
              sql: "SELECT * FROM ai_leaderboards ORDER BY wins DESC LIMIT ? OFFSET ?",
              args: [Math.min(limit, 100), offset],
            });

            const entries = result.rows.map(row => ({
              address: row.address as string,
              wins: Number(row.wins),
              rank: row.rank as string,
              display_name: row.display_name as string | null,
              updated_at: Number(row.updated_at),
            }));

            // Cache successful result
            await cacheManager.set(cacheKey, entries, {
              prefix: CACHE_PREFIXES.LEADERBOARD,
              ttl: CACHE_DURATIONS.LEADERBOARD,
            });

            return entries;
          });
        });
      },

      // Fallback operation
      async () => {
        console.warn(`[ResilientDB] Database unavailable, trying cache for leaderboard`);

        const cached = await cacheManager.get(cacheKey, {
          prefix: CACHE_PREFIXES.LEADERBOARD,
        });

        if (cached) {
          console.info(`[ResilientDB] Serving cached leaderboard`);
          return cached;
        }

        // Return empty leaderboard as last resort
        console.warn(`[ResilientDB] No cache available, returning empty leaderboard`);
        return [];
      },
    );
  }

  // Get match history with resilience
  static async getMatchHistory(address: string, limit: number = 50) {
    const cacheKey = `${address.toLowerCase()}:${limit}`;

    return circuitBreakers.database.execute(
      // Primary operation
      async () => {
        return withRetry(async () => {
          return withDatabase(async client => {
            const addr = address.toLowerCase();
            const result = await client.execute({
              sql: "SELECT * FROM matches WHERE player1 = ? OR player2 = ? ORDER BY timestamp_ms DESC LIMIT ?",
              args: [addr, addr, Math.min(limit, 100)],
            });

            const matches = result.rows.map(row => ({
              id: row.id,
              room_id: row.room_id,
              player1: row.player1,
              player2: row.player2,
              player1_move: row.player1_move,
              player2_move: row.player2_move,
              winner: row.winner,
              game_mode: row.game_mode,
              timestamp_ms: row.timestamp_ms,
              ipfs_hash: row.ipfs_hash,
              created_at: row.created_at,
            }));

            // Cache successful result
            await cacheManager.set(cacheKey, matches, {
              prefix: CACHE_PREFIXES.MATCH,
              ttl: CACHE_DURATIONS.MATCH_HISTORY,
            });

            return matches;
          });
        });
      },

      // Fallback operation
      async () => {
        console.warn(`[ResilientDB] Database unavailable, trying cache for match history: ${address}`);

        const cached = await cacheManager.get(cacheKey, {
          prefix: CACHE_PREFIXES.MATCH,
        });

        if (cached) {
          console.info(`[ResilientDB] Serving cached match history for: ${address}`);
          return cached;
        }

        // Return empty history as last resort
        console.warn(`[ResilientDB] No cache available, returning empty match history for: ${address}`);
        return [];
      },
    );
  }

  // Save match with resilience
  static async saveMatch(data: {
    roomId: string;
    player1: string;
    player2: string;
    player1Move: string;
    player2Move: string;
    winner: string | null;
    gameMode: string;
    timestampMs: number;
    ipfsHash?: string;
  }) {
    return circuitBreakers.database.execute(
      // Primary operation
      async () => {
        return withRetry(async () => {
          return withDatabase(async client => {
            await client.execute({
              sql: `INSERT INTO matches (room_id, player1, player2, player1_move, player2_move, winner, game_mode, timestamp_ms, ipfs_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                data.roomId,
                data.player1.toLowerCase(),
                data.player2.toLowerCase(),
                data.player1Move,
                data.player2Move,
                data.winner?.toLowerCase() || null,
                data.gameMode,
                data.timestampMs,
                data.ipfsHash || null,
              ],
            });

            // Invalidate match history cache for both players
            await Promise.all([
              cacheManager.invalidatePattern(`${data.player1.toLowerCase()}:*`, {
                prefix: CACHE_PREFIXES.MATCH,
              }),
              cacheManager.invalidatePattern(`${data.player2.toLowerCase()}:*`, {
                prefix: CACHE_PREFIXES.MATCH,
              }),
            ]);

            return true;
          });
        });
      },

      // Fallback operation
      async () => {
        console.error(`[ResilientDB] Failed to save match ${data.roomId}, database unavailable`);
        // Could implement a queue here to retry later
        return false;
      },
    );
  }

  // Update match-level statistics with resilience
  static async updateMatchStats(address: string, matchResult: "won" | "lost" | "tied" | "abandoned") {
    const addressLower = address.toLowerCase();

    return circuitBreakers.database.execute(
      // Primary operation: Update database with retry
      async () => {
        return withRetry(async () => {
          return withDatabase(async client => {
            // Get current stats first
            const current = await client.execute({
              sql: "SELECT * FROM stats WHERE address = ?",
              args: [addressLower],
            });

            let sql: string;
            let args: any[];

            if (current.rows.length === 0) {
              // Insert new record with match-level stats
              sql = `INSERT INTO stats (
                address, total_games, wins, losses, ties, 
                ai_games, ai_wins, ai_ties, 
                multiplayer_games, multiplayer_wins, multiplayer_ties,
                ai_matches_played, ai_matches_won, ai_matches_lost, ai_matches_tied, ai_matches_abandoned
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

              args = [
                addressLower,
                0, // total_games (matches don't count toward round-based stats)
                0, // wins
                0, // losses
                0, // ties
                0, // ai_games
                0, // ai_wins
                0, // ai_ties
                0, // multiplayer_games
                0, // multiplayer_wins
                0, // multiplayer_ties
                1, // ai_matches_played
                matchResult === "won" ? 1 : 0, // ai_matches_won
                matchResult === "lost" ? 1 : 0, // ai_matches_lost
                matchResult === "tied" ? 1 : 0, // ai_matches_tied
                matchResult === "abandoned" ? 1 : 0, // ai_matches_abandoned
              ];
            } else {
              // Update existing record with match-level stats only
              sql = `UPDATE stats SET 
                ai_matches_played = ai_matches_played + 1,
                ai_matches_won = ai_matches_won + ?,
                ai_matches_lost = ai_matches_lost + ?,
                ai_matches_tied = ai_matches_tied + ?,
                ai_matches_abandoned = ai_matches_abandoned + ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE address = ?`;

              args = [
                matchResult === "won" ? 1 : 0, // ai_matches_won
                matchResult === "lost" ? 1 : 0, // ai_matches_lost
                matchResult === "tied" ? 1 : 0, // ai_matches_tied
                matchResult === "abandoned" ? 1 : 0, // ai_matches_abandoned
                addressLower,
              ];
            }

            await client.execute({ sql, args });

            // Invalidate cache after successful update
            await cacheManager.invalidate(addressLower, {
              prefix: CACHE_PREFIXES.STATS,
            });

            return true;
          });
        });
      },

      // Fallback operation: Log failure but don't crash
      async () => {
        console.error(`[ResilientDB] Failed to update match stats for ${address}, database unavailable`);
        // Could implement a queue here to retry later
        return false;
      },
    );
  }
}

// Export convenience functions
export const resilientGetStats = ResilientDatabase.getStats;
export const resilientUpdateStats = ResilientDatabase.updateStats;
export const resilientUpdateMatchStats = ResilientDatabase.updateMatchStats;
export const resilientGetLeaderboard = ResilientDatabase.getLeaderboard;
export const resilientGetMatchHistory = ResilientDatabase.getMatchHistory;
export const resilientSaveMatch = ResilientDatabase.saveMatch;

// Re-export match leaderboard functions for consistency
export {
  getMatchLeaderboard,
  getPlayerMatchRanking,
  getLeaderboardAroundPlayer,
  compareMatchRankings,
  validateMatchLeaderboardEntry,
} from "./match-leaderboard";
