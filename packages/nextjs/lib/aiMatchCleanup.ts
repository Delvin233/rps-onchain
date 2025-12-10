/**
 * AI Match Cleanup Utilities
 *
 * Provides scheduled cleanup functions for abandoned and expired matches.
 * These functions should be called periodically via cron jobs or scheduled tasks.
 */
import { aiMatchManager } from "./aiMatchManager";

/**
 * Perform comprehensive match cleanup
 * This function should be called periodically (e.g., every hour)
 *
 * @param options - Cleanup configuration
 * @returns Cleanup results and metrics
 */
export async function performScheduledCleanup(
  options: {
    deleteAbandonedOlderThanDays?: number;
    cleanupExpiredActive?: boolean;
    logResults?: boolean;
  } = {},
): Promise<{
  success: boolean;
  results?: {
    expiredActiveMatches: number;
    deletedAbandonedMatches: number;
  };
  metrics?: {
    totalActiveMatches: number;
    recentAbandonments: number;
    cleanupRecommended: boolean;
  };
  error?: string;
}> {
  try {
    const startTime = Date.now();

    // Perform cleanup
    const results = await aiMatchManager.performMatchCleanup({
      deleteAbandonedOlderThanDays: options.deleteAbandonedOlderThanDays ?? 7,
      cleanupExpiredActive: options.cleanupExpiredActive ?? true,
    });

    // Get current metrics
    const metrics = await aiMatchManager.getAbandonmentMetrics();

    const duration = Date.now() - startTime;

    if (options.logResults !== false) {
      console.log(`[AI Match Cleanup] Completed in ${duration}ms:`, {
        expiredActiveMatches: results.expiredActiveMatches,
        deletedAbandonedMatches: results.deletedAbandonedMatches,
        totalActiveMatches: metrics.totalActiveMatches,
        recentAbandonments: metrics.recentAbandonments,
      });
    }

    return {
      success: true,
      results,
      metrics,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[AI Match Cleanup] Failed:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if cleanup is recommended based on current system state
 *
 * @returns Recommendation and current metrics
 */
export async function getCleanupRecommendation(): Promise<{
  recommended: boolean;
  reason?: string;
  metrics: {
    totalActiveMatches: number;
    recentAbandonments: number;
    cleanupRecommended: boolean;
  };
}> {
  try {
    const metrics = await aiMatchManager.getAbandonmentMetrics();

    let recommended = metrics.cleanupRecommended;
    let reason: string | undefined;

    if (metrics.totalActiveMatches > 100) {
      recommended = true;
      reason = `High number of active matches (${metrics.totalActiveMatches})`;
    } else if (metrics.recentAbandonments > 20) {
      recommended = true;
      reason = `High number of matches near timeout (${metrics.recentAbandonments})`;
    } else if (metrics.cleanupRecommended) {
      reason = "System recommends cleanup based on current state";
    }

    return {
      recommended,
      reason,
      metrics,
    };
  } catch (error) {
    console.error("[AI Match Cleanup] Error getting recommendation:", error);
    return {
      recommended: false,
      metrics: {
        totalActiveMatches: 0,
        recentAbandonments: 0,
        cleanupRecommended: false,
      },
    };
  }
}

/**
 * Emergency cleanup function for critical situations
 * This is more aggressive and should only be used when the system is under stress
 *
 * @returns Cleanup results
 */
export async function performEmergencyCleanup(): Promise<{
  success: boolean;
  results?: {
    expiredActiveMatches: number;
    deletedAbandonedMatches: number;
  };
  error?: string;
}> {
  try {
    console.log("[AI Match Cleanup] Performing emergency cleanup...");

    // More aggressive cleanup - delete abandoned matches older than 1 day
    const results = await aiMatchManager.performMatchCleanup({
      deleteAbandonedOlderThanDays: 1,
      cleanupExpiredActive: true,
    });

    console.log("[AI Match Cleanup] Emergency cleanup completed:", results);

    return {
      success: true,
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[AI Match Cleanup] Emergency cleanup failed:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
