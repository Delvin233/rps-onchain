/**
 * AI Match Manager
 *
 * Core logic for managing best-of-three AI matches including match lifecycle,
 * state management, and business logic validation.
 */
import {
  AIMatch,
  InvalidMatchStateError,
  MATCH_TIMEOUT_MINUTES,
  MAX_ROUNDS,
  MatchAbandonedError,
  MatchCompletedError,
  MatchNotFoundError,
  MatchStatus,
  Move,
  ROUNDS_TO_WIN,
  Round,
  RoundResult,
  RoundWinner,
  createEmptyMatch,
} from "../types/aiMatch";
import { generateAIMove } from "../utils/aiMatchUtils";
import {
  cleanupExpiredMatches,
  completeMatch,
  deleteOldAbandonedMatches,
  getActiveMatchForPlayer,
  getActiveMatchFromRedis,
  getAllActiveMatches,
  getPlayerMatchStats,
  saveActiveMatchToRedis,
} from "./aiMatchStorage";

/**
 * Core AI Match Manager class
 * Handles all match lifecycle operations and business logic
 */
export class AIMatchManager {
  /**
   * Start a new AI match for a player
   * @param playerId - Player's wallet address
   * @returns New match instance
   */
  async startMatch(playerId: string): Promise<AIMatch> {
    // Check if player already has an active match
    const existingMatch = await this.getActiveMatchForPlayer(playerId);
    if (existingMatch) {
      throw new InvalidMatchStateError(`Player ${playerId} already has an active match: ${existingMatch.id}`);
    }

    // Check for excessive abandonment patterns
    const hasExcessiveAbandonments = await this.hasExcessiveAbandonmentPattern(playerId);
    if (hasExcessiveAbandonments) {
      throw new InvalidMatchStateError(
        `Player ${playerId} has excessive abandonment patterns and is temporarily restricted from starting new matches`,
      );
    }

    // Create new match with unique ID
    const matchId = this.generateUniqueMatchId();
    const matchData = createEmptyMatch(playerId);

    const newMatch: AIMatch = {
      id: matchId,
      ...matchData,
    };

    // Save to Redis for active match tracking
    await saveActiveMatchToRedis(newMatch);

    return newMatch;
  }

  /**
   * Play a round in an existing match
   * @param matchId - Match identifier
   * @param playerMove - Player's move for this round
   * @returns Updated match state and round result
   */
  async playRound(matchId: string, playerMove: Move): Promise<{ match: AIMatch; roundResult: RoundResult }> {
    // Get current match state
    const match = await this.getMatchStatus(matchId);
    if (!match) {
      throw new MatchNotFoundError(matchId);
    }

    // Validate match can accept new rounds
    this.validateMatchForRound(match);

    // Generate AI move
    const aiMove = generateAIMove();

    // Determine round winner
    const roundWinner = this.determineRoundWinner(playerMove, aiMove);

    // Create round result
    const roundResult: RoundResult = {
      winner: roundWinner,
      playerMove,
      aiMove,
    };

    // Create round record
    const round: Round = {
      roundNumber: match.currentRound,
      playerMove,
      aiMove,
      result: roundResult,
      timestamp: new Date(),
    };

    // Update match state
    const updatedMatch = this.updateMatchAfterRound(match, round, roundWinner);

    // Save updated match state
    if (updatedMatch.status === MatchStatus.COMPLETED || updatedMatch.status === MatchStatus.ABANDONED) {
      // Move to permanent storage
      await completeMatch(updatedMatch);
    } else {
      // Update active match in Redis
      await saveActiveMatchToRedis(updatedMatch);
    }

    return { match: updatedMatch, roundResult };
  }

  /**
   * Get current match status
   * @param matchId - Match identifier
   * @returns Current match state or null if not found
   */
  async getMatchStatus(matchId: string): Promise<AIMatch | null> {
    // Try to get from Redis first (active matches)
    const activeMatch = await getActiveMatchFromRedis(matchId);
    if (activeMatch) {
      // Check if match has timed out
      if (this.isMatchTimedOut(activeMatch)) {
        const abandonedMatch = this.abandonMatch(activeMatch);
        await completeMatch(abandonedMatch);
        return abandonedMatch;
      }
      return activeMatch;
    }

    // If not in Redis, it might be completed - this would be handled by storage layer
    return null;
  }

  /**
   * Get active match for a specific player
   * @param playerId - Player's wallet address
   * @returns Active match or null if none exists
   */
  async getActiveMatchForPlayer(playerId: string): Promise<AIMatch | null> {
    return await getActiveMatchForPlayer(playerId);
  }

  /**
   * Abandon an active match
   * @param matchId - Match identifier
   * @returns Abandoned match state
   */
  async abandonMatchById(matchId: string): Promise<AIMatch> {
    const match = await this.getMatchStatus(matchId);
    if (!match) {
      throw new MatchNotFoundError(matchId);
    }

    if (match.status !== MatchStatus.ACTIVE) {
      throw new InvalidMatchStateError(`Cannot abandon match ${matchId} - not active`);
    }

    const abandonedMatch = this.abandonMatch(match);
    await completeMatch(abandonedMatch);

    return abandonedMatch;
  }

  /**
   * Check if a player has excessive abandonment patterns
   * @param playerId - Player's wallet address
   * @returns True if player should be restricted from starting new matches
   */
  async hasExcessiveAbandonmentPattern(playerId: string): Promise<boolean> {
    try {
      const stats = await getPlayerMatchStats(playerId);

      // If player has played fewer than 5 matches, no restrictions
      const totalMatches = stats.ai_matches_played + stats.ai_matches_abandoned;
      if (totalMatches < 5) {
        return false;
      }

      // Calculate abandonment rate
      const abandonmentRate = stats.ai_matches_abandoned / totalMatches;

      // Restrict if abandonment rate is 50% or higher and they have abandoned at least 3 matches
      return abandonmentRate >= 0.5 && stats.ai_matches_abandoned >= 3;
    } catch (error) {
      console.error(`Error checking abandonment pattern for player ${playerId}:`, error);
      // Default to allowing matches if we can't check stats
      return false;
    }
  }

  /**
   * Cleanup expired and abandoned matches
   * This should be called periodically (e.g., via cron job)
   * @param options - Cleanup configuration
   * @returns Cleanup results
   */
  async performMatchCleanup(
    options: {
      deleteAbandonedOlderThanDays?: number;
      cleanupExpiredActive?: boolean;
    } = {},
  ): Promise<{
    expiredActiveMatches: number;
    deletedAbandonedMatches: number;
  }> {
    const results = {
      expiredActiveMatches: 0,
      deletedAbandonedMatches: 0,
    };

    try {
      // Clean up expired active matches from Redis
      if (options.cleanupExpiredActive !== false) {
        results.expiredActiveMatches = await cleanupExpiredMatches();
      }

      // Delete old abandoned matches from database
      const daysThreshold = options.deleteAbandonedOlderThanDays ?? 7;
      results.deletedAbandonedMatches = await deleteOldAbandonedMatches(daysThreshold);

      console.log(
        `[AI Match Cleanup] Cleaned up ${results.expiredActiveMatches} expired active matches and deleted ${results.deletedAbandonedMatches} old abandoned matches`,
      );

      return results;
    } catch (error) {
      console.error("[AI Match Cleanup] Error during cleanup:", error);
      throw error;
    }
  }

  /**
   * Get abandonment statistics for monitoring
   * @returns System-wide abandonment metrics
   */
  async getAbandonmentMetrics(): Promise<{
    totalActiveMatches: number;
    recentAbandonments: number;
    cleanupRecommended: boolean;
  }> {
    try {
      // This is a simplified version - in production you might want more detailed metrics
      const activeMatches = await this.getAllActiveMatches();
      const totalActive = activeMatches.length;

      // Count matches that are close to timeout (8+ minutes inactive)
      const timeoutWarningMs = 8 * 60 * 1000; // 8 minutes
      const now = Date.now();
      const nearTimeout = activeMatches.filter(match => now - match.lastActivityAt.getTime() > timeoutWarningMs).length;

      return {
        totalActiveMatches: totalActive,
        recentAbandonments: nearTimeout,
        cleanupRecommended: nearTimeout > 10, // Recommend cleanup if many matches near timeout
      };
    } catch (error) {
      console.error("Error getting abandonment metrics:", error);
      return {
        totalActiveMatches: 0,
        recentAbandonments: 0,
        cleanupRecommended: false,
      };
    }
  }

  /**
   * Get all active matches (for monitoring/cleanup)
   * @returns List of all active matches
   */
  private async getAllActiveMatches(): Promise<AIMatch[]> {
    return await getAllActiveMatches();
  }

  /**
   * Generate a unique match ID with collision prevention
   * @returns Unique match identifier
   */
  private generateUniqueMatchId(): string {
    // Generate a unique ID using timestamp + random component
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `match_${timestamp}_${randomPart}`;
  }

  /**
   * Validate that a match can accept a new round
   * @param match - Current match state
   */
  private validateMatchForRound(match: AIMatch): void {
    if (match.status !== MatchStatus.ACTIVE) {
      if (match.status === MatchStatus.COMPLETED) {
        throw new MatchCompletedError(match.id);
      } else if (match.status === MatchStatus.ABANDONED) {
        throw new MatchAbandonedError(match.id);
      }
    }

    if (match.currentRound > MAX_ROUNDS) {
      throw new InvalidMatchStateError(`Match ${match.id} has exceeded maximum rounds`);
    }

    if (match.playerScore >= ROUNDS_TO_WIN || match.aiScore >= ROUNDS_TO_WIN) {
      throw new InvalidMatchStateError(`Match ${match.id} should already be completed`);
    }
  }

  /**
   * Determine the winner of a round based on moves
   * @param playerMove - Player's move
   * @param aiMove - AI's move
   * @returns Round winner
   */
  private determineRoundWinner(playerMove: Move, aiMove: Move): RoundWinner {
    if (playerMove === aiMove) {
      return "tie";
    }

    const winConditions: Record<Move, Move> = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper",
    };

    return winConditions[playerMove] === aiMove ? "player" : "ai";
  }

  /**
   * Update match state after a round is played
   * @param match - Current match state
   * @param round - Completed round
   * @param roundWinner - Winner of the round
   * @returns Updated match state
   */
  private updateMatchAfterRound(match: AIMatch, round: Round, roundWinner: RoundWinner): AIMatch {
    const updatedMatch: AIMatch = {
      ...match,
      rounds: [...match.rounds, round],
      lastActivityAt: new Date(),
      currentRound: match.currentRound + 1,
    };

    // Update scores based on round winner
    if (roundWinner === "player") {
      updatedMatch.playerScore += 1;
    } else if (roundWinner === "ai") {
      updatedMatch.aiScore += 1;
    }
    // Ties don't change scores

    // Check if match is completed (someone reached ROUNDS_TO_WIN)
    if (updatedMatch.playerScore >= ROUNDS_TO_WIN) {
      updatedMatch.status = MatchStatus.COMPLETED;
      updatedMatch.winner = "player";
      updatedMatch.completedAt = new Date();
    } else if (updatedMatch.aiScore >= ROUNDS_TO_WIN) {
      updatedMatch.status = MatchStatus.COMPLETED;
      updatedMatch.winner = "ai";
      updatedMatch.completedAt = new Date();
    } else if (updatedMatch.currentRound > MAX_ROUNDS) {
      // All rounds played, determine winner by score
      updatedMatch.status = MatchStatus.COMPLETED;
      updatedMatch.completedAt = new Date();

      if (updatedMatch.playerScore > updatedMatch.aiScore) {
        updatedMatch.winner = "player";
      } else if (updatedMatch.aiScore > updatedMatch.playerScore) {
        updatedMatch.winner = "ai";
      } else {
        updatedMatch.winner = "tie";
      }
    }

    return updatedMatch;
  }

  /**
   * Check if a match has timed out
   * @param match - Match to check
   * @returns True if match has timed out
   */
  private isMatchTimedOut(match: AIMatch): boolean {
    const timeoutMs = MATCH_TIMEOUT_MINUTES * 60 * 1000;
    const timeSinceLastActivity = Date.now() - match.lastActivityAt.getTime();
    return timeSinceLastActivity > timeoutMs;
  }

  /**
   * Mark a match as abandoned
   * @param match - Match to abandon
   * @returns Abandoned match state
   */
  private abandonMatch(match: AIMatch): AIMatch {
    return {
      ...match,
      status: MatchStatus.ABANDONED,
      isAbandoned: true,
      winner: "ai", // AI wins by default when player abandons
      completedAt: new Date(),
      lastActivityAt: new Date(),
    };
  }
}

// Export singleton instance
export const aiMatchManager = new AIMatchManager();
