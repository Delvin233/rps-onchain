/**
 * Match-Based Leaderboard System
 *
 * This module implements leaderboard ranking based on completed AI match victories
 * (best-of-three matches), distinct from the existing round-based ranking system.
 *
 * Requirements 3.5: Leaderboard ranking based on match victories
 * - Rankings are based on completed match wins, not individual round wins
 * - Proper sorting and tie-breaking logic
 * - Clear distinction from round-based rankings
 * - Support for pagination and efficient querying
 */
import { turso } from "./turso";

export interface MatchLeaderboardEntry {
  address: string;
  matchWins: number;
  matchesPlayed: number;
  matchWinRate: number;
  position: number;
  displayName?: string | null;
  updatedAt: number;
}

export interface MatchLeaderboardQuery {
  limit?: number;
  offset?: number;
  minMatches?: number;
}

export interface MatchLeaderboardResult {
  entries: MatchLeaderboardEntry[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

/**
 * Get match-based leaderboard rankings with proper sorting and tie-breaking
 *
 * Sorting criteria (in order of priority):
 * 1. Match wins (descending)
 * 2. Match win rate (descending) - for tie-breaking
 * 3. Total matches played (descending) - for further tie-breaking
 * 4. Address (ascending) - for consistent ordering
 *
 * @param query - Query parameters for pagination and filtering
 * @returns Formatted leaderboard results with rankings
 */
export async function getMatchLeaderboard(query: MatchLeaderboardQuery = {}): Promise<MatchLeaderboardResult> {
  const { limit = 50, offset = 0, minMatches = 0 } = query;

  // Validate parameters
  if (limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100");
  }

  if (offset < 0) {
    throw new Error("Offset must be non-negative");
  }

  if (minMatches < 0) {
    throw new Error("Minimum matches must be non-negative");
  }

  try {
    // Build the base query for match-based statistics
    // We use ai_matches_won for ranking (completed match victories)
    // and ai_matches_played for total completed matches
    const baseQuery = `
      SELECT 
        address,
        COALESCE(ai_matches_won, 0) as match_wins,
        COALESCE(ai_matches_played, 0) as matches_played,
        CASE 
          WHEN COALESCE(ai_matches_played, 0) > 0 
          THEN ROUND((COALESCE(ai_matches_won, 0) * 100.0) / COALESCE(ai_matches_played, 0), 2)
          ELSE 0.0
        END as match_win_rate,
        updated_at
      FROM stats 
      WHERE COALESCE(ai_matches_played, 0) >= ?
    `;

    // Add sorting criteria for proper ranking
    // Primary: match wins (descending)
    // Secondary: win rate (descending) for tie-breaking
    // Tertiary: matches played (descending) for further tie-breaking
    // Quaternary: address (ascending) for consistent ordering
    const orderBy = `
      ORDER BY 
        match_wins DESC,
        match_win_rate DESC,
        matches_played DESC,
        address ASC
    `;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM stats 
      WHERE COALESCE(ai_matches_played, 0) >= ?
    `;

    const countResult = await turso.execute({
      sql: countQuery,
      args: [minMatches],
    });

    const total = Number(countResult.rows[0]?.total || 0);

    // Get paginated results
    const dataQuery = baseQuery + orderBy + ` LIMIT ? OFFSET ?`;

    const dataResult = await turso.execute({
      sql: dataQuery,
      args: [minMatches, limit, offset],
    });

    // Format entries with position calculation
    const entries: MatchLeaderboardEntry[] = dataResult.rows.map((row, index) => ({
      address: row.address as string,
      matchWins: Number(row.match_wins),
      matchesPlayed: Number(row.matches_played),
      matchWinRate: Number(row.match_win_rate),
      position: offset + index + 1,
      displayName: null, // Will be resolved separately if needed
      updatedAt: Number(row.updated_at || Date.now()),
    }));

    const hasMore = offset + entries.length < total;

    return {
      entries,
      total,
      hasMore,
      limit,
      offset,
    };
  } catch (error) {
    console.error("[MatchLeaderboard] Error fetching match leaderboard:", error);
    throw new Error(`Failed to fetch match leaderboard: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get a specific player's match-based ranking position
 *
 * @param address - Player's wallet address
 * @returns Player's ranking information or null if not found
 */
export async function getPlayerMatchRanking(address: string): Promise<MatchLeaderboardEntry | null> {
  const lowerAddress = address.toLowerCase();

  try {
    // Get player's match statistics
    const playerQuery = `
      SELECT 
        address,
        COALESCE(ai_matches_won, 0) as match_wins,
        COALESCE(ai_matches_played, 0) as matches_played,
        CASE 
          WHEN COALESCE(ai_matches_played, 0) > 0 
          THEN ROUND((COALESCE(ai_matches_won, 0) * 100.0) / COALESCE(ai_matches_played, 0), 2)
          ELSE 0.0
        END as match_win_rate,
        updated_at
      FROM stats 
      WHERE address = ?
    `;

    const playerResult = await turso.execute({
      sql: playerQuery,
      args: [lowerAddress],
    });

    if (playerResult.rows.length === 0) {
      return null;
    }

    const playerRow = playerResult.rows[0];
    const playerMatchWins = Number(playerRow.match_wins);
    const playerMatchesPlayed = Number(playerRow.matches_played);
    const playerWinRate = Number(playerRow.match_win_rate);

    // Calculate position by counting players with better rankings
    // Using the same tie-breaking logic as the main leaderboard
    const positionQuery = `
      SELECT COUNT(*) + 1 as position
      FROM stats 
      WHERE (
        COALESCE(ai_matches_won, 0) > ? OR
        (COALESCE(ai_matches_won, 0) = ? AND (
          CASE 
            WHEN COALESCE(ai_matches_played, 0) > 0 
            THEN ROUND((COALESCE(ai_matches_won, 0) * 100.0) / COALESCE(ai_matches_played, 0), 2)
            ELSE 0.0
          END > ? OR
          (CASE 
            WHEN COALESCE(ai_matches_played, 0) > 0 
            THEN ROUND((COALESCE(ai_matches_won, 0) * 100.0) / COALESCE(ai_matches_played, 0), 2)
            ELSE 0.0
          END = ? AND (
            COALESCE(ai_matches_played, 0) > ? OR
            (COALESCE(ai_matches_played, 0) = ? AND address < ?)
          ))
        ))
      )
    `;

    const positionResult = await turso.execute({
      sql: positionQuery,
      args: [
        playerMatchWins,
        playerMatchWins,
        playerWinRate,
        playerWinRate,
        playerMatchesPlayed,
        playerMatchesPlayed,
        lowerAddress,
      ],
    });

    const position = Number(positionResult.rows[0]?.position || 1);

    return {
      address: lowerAddress,
      matchWins: playerMatchWins,
      matchesPlayed: playerMatchesPlayed,
      matchWinRate: playerWinRate,
      position,
      displayName: null,
      updatedAt: Number(playerRow.updated_at || Date.now()),
    };
  } catch (error) {
    console.error("[MatchLeaderboard] Error getting player match ranking:", error);
    throw new Error(`Failed to get player match ranking: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get leaderboard entries around a specific player's position
 * Useful for showing a player's ranking context
 *
 * @param address - Player's wallet address
 * @param range - Number of entries to show above and below the player (default: 5)
 * @returns Leaderboard entries around the player's position
 */
export async function getLeaderboardAroundPlayer(address: string, range: number = 5): Promise<MatchLeaderboardEntry[]> {
  const playerRanking = await getPlayerMatchRanking(address);

  if (!playerRanking) {
    return [];
  }

  // Calculate offset to center the player in the results
  const offset = Math.max(0, playerRanking.position - range - 1);
  const limit = range * 2 + 1;

  const result = await getMatchLeaderboard({ limit, offset });
  return result.entries;
}

/**
 * Compare two players' match-based rankings
 * Returns positive if player1 ranks higher, negative if player2 ranks higher, 0 if tied
 *
 * @param player1 - First player's ranking data
 * @param player2 - Second player's ranking data
 * @returns Comparison result for sorting
 */
export function compareMatchRankings(player1: MatchLeaderboardEntry, player2: MatchLeaderboardEntry): number {
  // Primary: match wins (descending)
  if (player1.matchWins !== player2.matchWins) {
    return player2.matchWins - player1.matchWins;
  }

  // Secondary: win rate (descending)
  if (player1.matchWinRate !== player2.matchWinRate) {
    return player2.matchWinRate - player1.matchWinRate;
  }

  // Tertiary: matches played (descending)
  if (player1.matchesPlayed !== player2.matchesPlayed) {
    return player2.matchesPlayed - player1.matchesPlayed;
  }

  // Quaternary: address (ascending) for consistent ordering
  return player1.address.localeCompare(player2.address);
}

/**
 * Validate match leaderboard entry data
 *
 * @param entry - Leaderboard entry to validate
 * @returns True if valid, throws error if invalid
 */
export function validateMatchLeaderboardEntry(entry: MatchLeaderboardEntry): boolean {
  if (!entry.address || typeof entry.address !== "string") {
    throw new Error("Invalid address in leaderboard entry");
  }

  if (typeof entry.matchWins !== "number" || entry.matchWins < 0) {
    throw new Error("Invalid match wins in leaderboard entry");
  }

  if (typeof entry.matchesPlayed !== "number" || entry.matchesPlayed < 0) {
    throw new Error("Invalid matches played in leaderboard entry");
  }

  if (entry.matchWins > entry.matchesPlayed) {
    throw new Error("Match wins cannot exceed matches played");
  }

  if (typeof entry.matchWinRate !== "number" || entry.matchWinRate < 0 || entry.matchWinRate > 100) {
    throw new Error("Invalid match win rate in leaderboard entry");
  }

  if (typeof entry.position !== "number" || entry.position < 1) {
    throw new Error("Invalid position in leaderboard entry");
  }

  return true;
}
