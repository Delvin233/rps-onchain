/**
 * AI Match Storage Operations
 *
 * This file contains database operations for AI match persistence,
 * including both Turso (completed matches) and Redis (active matches) operations.
 */
import { AIMatch, AIMatchRow, MatchStatus, convertMatchToRow, convertRowToMatch } from "../types/aiMatch";
import { turso } from "./turso";

// ============================================
// Turso Database Operations (Completed Matches)
// ============================================

/**
 * Save a completed AI match to Turso database
 */
export async function saveCompletedMatch(match: AIMatch): Promise<void> {
  if (match.status !== MatchStatus.COMPLETED && match.status !== MatchStatus.ABANDONED) {
    throw new Error("Only completed or abandoned matches can be saved to database");
  }

  try {
    const row = convertMatchToRow(match);

    await turso.execute({
      sql: `INSERT INTO ai_matches (
        id, player_id, status, player_score, ai_score, current_round,
        rounds_data, started_at, last_activity_at, completed_at, winner, is_abandoned
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        row.player_id,
        row.status,
        row.player_score,
        row.ai_score,
        row.current_round,
        row.rounds_data,
        row.started_at,
        row.last_activity_at,
        row.completed_at || null,
        row.winner || null,
        row.is_abandoned,
      ],
    });
  } catch (error) {
    console.error("Error saving completed match:", error);
    throw error;
  }
}

/**
 * Get a completed match by ID from Turso
 */
export async function getCompletedMatch(matchId: string): Promise<AIMatch | null> {
  try {
    const result = await turso.execute({
      sql: "SELECT * FROM ai_matches WHERE id = ?",
      args: [matchId],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as unknown as AIMatchRow;
    return convertRowToMatch(row);
  } catch (error) {
    console.error("Error getting completed match:", error);
    throw error;
  }
}

/**
 * Get match history for a player from Turso
 */
export async function getPlayerMatchHistory(
  playerId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<AIMatch[]> {
  try {
    const result = await turso.execute({
      sql: `SELECT * FROM ai_matches 
            WHERE player_id = ? 
            ORDER BY completed_at DESC, created_at DESC 
            LIMIT ? OFFSET ?`,
      args: [playerId.toLowerCase(), limit, offset],
    });

    return result.rows.map(row => convertRowToMatch(row as unknown as AIMatchRow));
  } catch (error) {
    console.error("Error getting player match history:", error);
    throw error;
  }
}

/**
 * Get total match count for a player
 */
export async function getPlayerMatchCount(playerId: string): Promise<number> {
  try {
    const result = await turso.execute({
      sql: "SELECT COUNT(*) as count FROM ai_matches WHERE player_id = ?",
      args: [playerId.toLowerCase()],
    });

    return Number(result.rows[0].count);
  } catch (error) {
    console.error("Error getting player match count:", error);
    throw error;
  }
}

/**
 * Update match-level statistics after match completion
 */
export async function updateMatchStatistics(
  playerId: string,
  matchResult: "won" | "lost" | "tied" | "abandoned",
): Promise<void> {
  try {
    const addr = playerId.toLowerCase();

    // Determine which columns to increment
    const increments = {
      ai_matches_played: matchResult !== "abandoned" ? 1 : 0,
      ai_matches_won: matchResult === "won" ? 1 : 0,
      ai_matches_lost: matchResult === "lost" ? 1 : 0,
      ai_matches_tied: matchResult === "tied" ? 1 : 0,
      ai_matches_abandoned: matchResult === "abandoned" ? 1 : 0,
    };

    await turso.execute({
      sql: `INSERT INTO stats (
        address, ai_matches_played, ai_matches_won, ai_matches_lost, 
        ai_matches_tied, ai_matches_abandoned, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(address) DO UPDATE SET
        ai_matches_played = ai_matches_played + ?,
        ai_matches_won = ai_matches_won + ?,
        ai_matches_lost = ai_matches_lost + ?,
        ai_matches_tied = ai_matches_tied + ?,
        ai_matches_abandoned = ai_matches_abandoned + ?,
        updated_at = CURRENT_TIMESTAMP`,
      args: [
        addr,
        increments.ai_matches_played,
        increments.ai_matches_won,
        increments.ai_matches_lost,
        increments.ai_matches_tied,
        increments.ai_matches_abandoned,
        increments.ai_matches_played,
        increments.ai_matches_won,
        increments.ai_matches_lost,
        increments.ai_matches_tied,
        increments.ai_matches_abandoned,
      ],
    });
  } catch (error) {
    console.error("Error updating match statistics:", error);
    throw error;
  }
}

/**
 * Get match-level statistics for a player
 */
export async function getPlayerMatchStats(playerId: string) {
  try {
    const result = await turso.execute({
      sql: `SELECT 
        ai_matches_played, ai_matches_won, ai_matches_lost, 
        ai_matches_tied, ai_matches_abandoned 
      FROM stats WHERE address = ?`,
      args: [playerId.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return {
        ai_matches_played: 0,
        ai_matches_won: 0,
        ai_matches_lost: 0,
        ai_matches_tied: 0,
        ai_matches_abandoned: 0,
      };
    }

    const row = result.rows[0];
    return {
      ai_matches_played: Number(row.ai_matches_played) || 0,
      ai_matches_won: Number(row.ai_matches_won) || 0,
      ai_matches_lost: Number(row.ai_matches_lost) || 0,
      ai_matches_tied: Number(row.ai_matches_tied) || 0,
      ai_matches_abandoned: Number(row.ai_matches_abandoned) || 0,
    };
  } catch (error) {
    console.error("Error getting player match stats:", error);
    throw error;
  }
}

/**
 * Get recent matches across all players (for admin/monitoring)
 */
export async function getRecentMatches(limit: number = 100): Promise<AIMatch[]> {
  try {
    const result = await turso.execute({
      sql: `SELECT * FROM ai_matches 
            ORDER BY completed_at DESC, created_at DESC 
            LIMIT ?`,
      args: [limit],
    });

    return result.rows.map(row => convertRowToMatch(row as unknown as AIMatchRow));
  } catch (error) {
    console.error("Error getting recent matches:", error);
    throw error;
  }
}

/**
 * Delete old abandoned matches (cleanup utility)
 */
export async function deleteOldAbandonedMatches(olderThanDays: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

    const result = await turso.execute({
      sql: `DELETE FROM ai_matches 
            WHERE status = 'abandoned' 
            AND last_activity_at < ?`,
      args: [cutoffDate],
    });

    return result.rowsAffected || 0;
  } catch (error) {
    console.error("Error deleting old abandoned matches:", error);
    throw error;
  }
}

// ============================================
// Redis Operations (Active Matches) - Placeholder
// ============================================
// Note: Redis operations will be implemented in the next task
// when we create the AIMatchManager and storage layer

/**
 * Save active match to Redis (placeholder)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function saveActiveMatchToRedis(_match: AIMatch): Promise<void> {
  // TODO: Implement Redis operations in next task
  console.log("Redis operations will be implemented in AIMatchManager");
}

/**
 * Get active match from Redis (placeholder)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getActiveMatchFromRedis(_matchId: string): Promise<AIMatch | null> {
  // TODO: Implement Redis operations in next task
  console.log("Redis operations will be implemented in AIMatchManager");
  return null;
}

/**
 * Delete active match from Redis (placeholder)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteActiveMatchFromRedis(_matchId: string): Promise<void> {
  // TODO: Implement Redis operations in next task
  console.log("Redis operations will be implemented in AIMatchManager");
}

// ============================================
// Combined Operations
// ============================================

/**
 * Complete a match: move from Redis to Turso and update stats
 */
export async function completeMatch(match: AIMatch): Promise<void> {
  if (match.status !== MatchStatus.COMPLETED && match.status !== MatchStatus.ABANDONED) {
    throw new Error("Match must be completed or abandoned to be finalized");
  }

  try {
    // Save to Turso database
    await saveCompletedMatch(match);

    // Update statistics
    let result: "won" | "lost" | "tied" | "abandoned";
    if (match.isAbandoned) {
      result = "abandoned";
    } else if (match.winner === "player") {
      result = "won";
    } else if (match.winner === "ai") {
      result = "lost";
    } else {
      result = "tied";
    }

    await updateMatchStatistics(match.playerId, result);

    // Remove from Redis (will be implemented in next task)
    await deleteActiveMatchFromRedis(match.id);

    console.log(`Match ${match.id} completed and saved to database`);
  } catch (error) {
    console.error("Error completing match:", error);
    throw error;
  }
}

/**
 * Get match from either Redis (active) or Turso (completed)
 */
export async function getMatch(matchId: string): Promise<AIMatch | null> {
  try {
    // First try Redis for active matches
    const activeMatch = await getActiveMatchFromRedis(matchId);
    if (activeMatch) {
      return activeMatch;
    }

    // Then try Turso for completed matches
    const completedMatch = await getCompletedMatch(matchId);
    return completedMatch;
  } catch (error) {
    console.error("Error getting match:", error);
    throw error;
  }
}
