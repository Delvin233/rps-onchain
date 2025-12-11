/**
 * AI Match Cleanup System
 *
 * This module provides automated cleanup functionality for expired AI matches
 * in Redis, memory management, and cleanup metrics. Integrates with existing
 * Vercel cron jobs to avoid exceeding the daily cron limit.
 */
import { aiMatchManager } from "./aiMatchManager";
import { aiMatchMetrics } from "./aiMatchMetrics";
import { createClient } from "redis";

// Cleanup configuration
const CLEANUP_CONFIG = {
  // Run cleanup every 5 minutes
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
  // Matches expire after 10 minutes of inactivity
  MATCH_EXPIRY_MS: 10 * 60 * 1000,
  // Batch size for cleanup operations
  CLEANUP_BATCH_SIZE: 100,
  // Maximum cleanup operations per run
  MAX_CLEANUP_PER_RUN: 1000,
} as const;

// Redis key patterns for AI matches
const REDIS_PATTERNS = {
  ACTIVE_MATCHES: "ai_match:*",
  MATCH_METADATA: "ai_match_meta:*",
  PLAYER_ACTIVE: "player_active_match:*",
} as const;

export interface CleanupMetrics {
  totalMatchesScanned: number;
  expiredMatchesFound: number;
  matchesCleanedUp: number;
  cleanupErrors: number;
  memoryFreed: number; // in bytes
  cleanupDuration: number; // in milliseconds
  timestamp: Date;
}

export interface CleanupJobStatus {
  isRunning: boolean;
  lastRunTime: Date | null;
  nextRunTime: Date | null;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageCleanupTime: number;
  lastCleanupMetrics: CleanupMetrics | null;
}

/**
 * AI Match Cleanup Manager
 * Handles automated cleanup of expired matches and memory management
 */
export class AIMatchCleanupManager {
  private static instance: AIMatchCleanupManager;
  private client: ReturnType<typeof createClient> | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private jobStatus: CleanupJobStatus = {
    isRunning: false,
    lastRunTime: null,
    nextRunTime: null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    averageCleanupTime: 0,
    lastCleanupMetrics: null,
  };

  static getInstance(): AIMatchCleanupManager {
    if (!AIMatchCleanupManager.instance) {
      AIMatchCleanupManager.instance = new AIMatchCleanupManager();
    }
    return AIMatchCleanupManager.instance;
  }

  // Method for testing - resets the singleton instance
  static resetInstance(): void {
    if (AIMatchCleanupManager.instance) {
      AIMatchCleanupManager.instance.stopCleanupJob();
    }
    AIMatchCleanupManager.instance = new AIMatchCleanupManager();
  }

  private async getClient(): Promise<ReturnType<typeof createClient>> {
    if (this.client && this.client.isReady) {
      return this.client;
    }

    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: retries => Math.min(retries * 50, 1000),
      },
    });

    this.client.on("error", err => {
      console.error("[AI Match Cleanup] Redis connection error:", err);
    });

    await this.client.connect();
    console.log("[AI Match Cleanup] Redis connected successfully");
    return this.client;
  }

  /**
   * Start the automated cleanup job
   */
  async startCleanupJob(): Promise<void> {
    if (this.cleanupInterval) {
      console.log("[AI Match Cleanup] Cleanup job already running");
      return;
    }

    console.log("[AI Match Cleanup] Starting cleanup job...");

    // Run initial cleanup
    await this.runCleanup();

    // Schedule recurring cleanup
    this.cleanupInterval = setInterval(async () => {
      await this.runCleanup();
    }, CLEANUP_CONFIG.CLEANUP_INTERVAL_MS);

    // Update next run time
    this.jobStatus.nextRunTime = new Date(Date.now() + CLEANUP_CONFIG.CLEANUP_INTERVAL_MS);

    console.log(
      `[AI Match Cleanup] Cleanup job started, running every ${CLEANUP_CONFIG.CLEANUP_INTERVAL_MS / 1000} seconds`,
    );
  }

  /**
   * Stop the automated cleanup job
   */
  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.jobStatus.nextRunTime = null;
      console.log("[AI Match Cleanup] Cleanup job stopped");
    }
  }

  /**
   * Run a single cleanup operation
   */
  async runCleanup(): Promise<CleanupMetrics> {
    if (this.isRunning) {
      console.log("[AI Match Cleanup] Cleanup already in progress, skipping...");
      return this.jobStatus.lastCleanupMetrics || this.getDefaultCleanupMetrics();
    }

    this.isRunning = true;
    this.jobStatus.totalRuns++;
    const startTime = Date.now();

    try {
      console.log("[AI Match Cleanup] Starting cleanup operation...");

      const client = await this.getClient();
      const metrics = await this.performCleanup(client);

      // Update job status
      this.jobStatus.successfulRuns++;
      this.jobStatus.lastRunTime = new Date();
      this.jobStatus.nextRunTime = new Date(Date.now() + CLEANUP_CONFIG.CLEANUP_INTERVAL_MS);
      this.jobStatus.lastCleanupMetrics = metrics;

      // Update average cleanup time
      const cleanupDuration = Date.now() - startTime;
      this.jobStatus.averageCleanupTime =
        (this.jobStatus.averageCleanupTime * (this.jobStatus.successfulRuns - 1) + cleanupDuration) /
        this.jobStatus.successfulRuns;

      // Record metrics
      await aiMatchMetrics.recordDatabaseOperationTime("cleanup_expired_matches", "redis", cleanupDuration, true);

      console.log(
        `[AI Match Cleanup] Cleanup completed: ${metrics.matchesCleanedUp} matches cleaned, ${metrics.memoryFreed} bytes freed`,
      );

      return metrics;
    } catch (error) {
      this.jobStatus.failedRuns++;
      console.error("[AI Match Cleanup] Cleanup operation failed:", error);

      // Record failed operation
      await aiMatchMetrics.recordDatabaseOperationTime(
        "cleanup_expired_matches",
        "redis",
        Date.now() - startTime,
        false,
      );

      return this.getDefaultCleanupMetrics();
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Perform the actual cleanup operations
   */
  private async performCleanup(client: ReturnType<typeof createClient>): Promise<CleanupMetrics> {
    const startTime = Date.now();
    let totalScanned = 0;
    let expiredFound = 0;
    let cleanedUp = 0;
    let errors = 0;
    let memoryFreed = 0;

    try {
      // Get all active match keys
      const matchKeys = await client.keys(REDIS_PATTERNS.ACTIVE_MATCHES);
      totalScanned = matchKeys.length;

      console.log(`[AI Match Cleanup] Found ${totalScanned} active matches to check`);

      // Process matches in batches
      for (let i = 0; i < matchKeys.length; i += CLEANUP_CONFIG.CLEANUP_BATCH_SIZE) {
        const batch = matchKeys.slice(i, i + CLEANUP_CONFIG.CLEANUP_BATCH_SIZE);

        for (const matchKey of batch) {
          try {
            const isExpired = await this.isMatchExpired(client, matchKey);

            if (isExpired) {
              expiredFound++;
              const memoryBefore = await this.getKeyMemoryUsage(client, matchKey);
              const cleaned = await this.cleanupExpiredMatch(client, matchKey);

              if (cleaned) {
                cleanedUp++;
                memoryFreed += memoryBefore;
              }
            }

            // Respect cleanup limits
            if (cleanedUp >= CLEANUP_CONFIG.MAX_CLEANUP_PER_RUN) {
              console.log(`[AI Match Cleanup] Reached cleanup limit (${CLEANUP_CONFIG.MAX_CLEANUP_PER_RUN}), stopping`);
              break;
            }
          } catch (error) {
            errors++;
            console.error(`[AI Match Cleanup] Error processing match ${matchKey}:`, error);
          }
        }

        // Break if we've hit the cleanup limit
        if (cleanedUp >= CLEANUP_CONFIG.MAX_CLEANUP_PER_RUN) {
          break;
        }
      }

      // Clean up orphaned metadata and player references
      await this.cleanupOrphanedData(client);
    } catch (error) {
      console.error("[AI Match Cleanup] Error during cleanup operation:", error);
      errors++;
    }

    const cleanupDuration = Date.now() - startTime;

    return {
      totalMatchesScanned: totalScanned,
      expiredMatchesFound: expiredFound,
      matchesCleanedUp: cleanedUp,
      cleanupErrors: errors,
      memoryFreed,
      cleanupDuration,
      timestamp: new Date(),
    };
  }

  /**
   * Check if a match has expired based on last activity
   */
  private async isMatchExpired(client: ReturnType<typeof createClient>, matchKey: string): Promise<boolean> {
    try {
      // Get match data
      const matchData = await client.get(matchKey);
      if (!matchData) {
        return true; // Key doesn't exist, consider it expired
      }

      const match = JSON.parse(matchData);
      const lastActivity = new Date(match.lastActivity || match.createdAt);
      const now = new Date();
      const timeSinceActivity = now.getTime() - lastActivity.getTime();

      return timeSinceActivity > CLEANUP_CONFIG.MATCH_EXPIRY_MS;
    } catch (error) {
      console.error(`[AI Match Cleanup] Error checking expiry for ${matchKey}:`, error);
      return false; // Don't clean up if we can't determine expiry
    }
  }

  /**
   * Clean up an expired match and all related data
   */
  private async cleanupExpiredMatch(client: ReturnType<typeof createClient>, matchKey: string): Promise<boolean> {
    try {
      // Get match data before deletion
      const matchData = await client.get(matchKey);
      if (!matchData) {
        return false;
      }

      const match = JSON.parse(matchData);
      const matchId = match.id;
      const playerId = match.playerId;

      // Start transaction for atomic cleanup
      const multi = client.multi();

      // Delete main match data
      multi.del(matchKey);

      // Delete match metadata
      multi.del(`ai_match_meta:${matchId}`);

      // Remove player's active match reference
      multi.del(`player_active_match:${playerId}`);

      // Delete any round-specific data
      for (let i = 1; i <= 3; i++) {
        multi.del(`ai_match_round:${matchId}:${i}`);
      }

      // Execute all deletions atomically
      await multi.exec();

      // Update abandonment metrics if match was not completed
      if (match.status === "active") {
        await this.recordAbandonedMatch(match);
      }

      console.log(`[AI Match Cleanup] Cleaned up expired match: ${matchId}`);
      return true;
    } catch (error) {
      console.error(`[AI Match Cleanup] Error cleaning up match ${matchKey}:`, error);
      return false;
    }
  }

  /**
   * Clean up orphaned metadata and player references
   */
  private async cleanupOrphanedData(client: ReturnType<typeof createClient>): Promise<void> {
    try {
      // Clean up orphaned metadata
      const metaKeys = await client.keys(REDIS_PATTERNS.MATCH_METADATA);
      for (const metaKey of metaKeys) {
        const matchId = metaKey.split(":")[1];
        const matchExists = await client.exists(`ai_match:${matchId}`);

        if (!matchExists) {
          await client.del(metaKey);
          console.log(`[AI Match Cleanup] Removed orphaned metadata: ${metaKey}`);
        }
      }

      // Clean up orphaned player references
      const playerKeys = await client.keys(REDIS_PATTERNS.PLAYER_ACTIVE);
      for (const playerKey of playerKeys) {
        const matchId = await client.get(playerKey);
        if (matchId) {
          const matchExists = await client.exists(`ai_match:${matchId}`);

          if (!matchExists) {
            await client.del(playerKey);
            console.log(`[AI Match Cleanup] Removed orphaned player reference: ${playerKey}`);
          }
        }
      }
    } catch (error) {
      console.error("[AI Match Cleanup] Error cleaning up orphaned data:", error);
    }
  }

  /**
   * Record an abandoned match for metrics
   */
  private async recordAbandonedMatch(match: any): Promise<void> {
    try {
      // This would typically update your statistics system
      // For now, we'll just log it and update metrics
      console.log(`[AI Match Cleanup] Recording abandoned match: ${match.id}`);

      // You could call your statistics system here
      // await updatePlayerStats(match.playerId, { abandonedMatches: 1 });
    } catch (error) {
      console.error("[AI Match Cleanup] Error recording abandoned match:", error);
    }
  }

  /**
   * Estimate memory usage of a Redis key
   */
  private async getKeyMemoryUsage(client: ReturnType<typeof createClient>, key: string): Promise<number> {
    try {
      // Use MEMORY USAGE command if available, otherwise estimate
      const memoryUsage = await client.sendCommand(["MEMORY", "USAGE", key]);
      return typeof memoryUsage === "number" ? memoryUsage : 0;
    } catch {
      // Fallback: estimate based on serialized data size
      try {
        const data = await client.get(key);
        return data ? Buffer.byteLength(data, "utf8") : 0;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Get current cleanup job status
   */
  getJobStatus(): CleanupJobStatus {
    return { ...this.jobStatus };
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalMatchesInRedis: number;
    estimatedExpiredMatches: number;
    totalMemoryUsage: number;
    cleanupJobStatus: CleanupJobStatus;
  }> {
    try {
      const client = await this.getClient();

      // Count total matches
      const matchKeys = await client.keys(REDIS_PATTERNS.ACTIVE_MATCHES);
      const totalMatches = matchKeys.length;

      // Estimate expired matches (sample a subset for performance)
      const sampleSize = Math.min(50, matchKeys.length);
      const sampleKeys = matchKeys.slice(0, sampleSize);
      let expiredInSample = 0;

      for (const key of sampleKeys) {
        const isExpired = await this.isMatchExpired(client, key);
        if (isExpired) expiredInSample++;
      }

      const estimatedExpired = sampleSize > 0 ? Math.round((expiredInSample / sampleSize) * totalMatches) : 0;

      // Estimate total memory usage
      let totalMemory = 0;
      const memorySampleKeys = matchKeys.slice(0, 10); // Sample 10 keys for memory estimation
      for (const key of memorySampleKeys) {
        totalMemory += await this.getKeyMemoryUsage(client, key);
      }
      const estimatedTotalMemory =
        memorySampleKeys.length > 0 ? (totalMemory / memorySampleKeys.length) * totalMatches : 0;

      return {
        totalMatchesInRedis: totalMatches,
        estimatedExpiredMatches: estimatedExpired,
        totalMemoryUsage: estimatedTotalMemory,
        cleanupJobStatus: this.getJobStatus(),
      };
    } catch (error) {
      console.error("[AI Match Cleanup] Error getting cleanup stats:", error);
      return {
        totalMatchesInRedis: 0,
        estimatedExpiredMatches: 0,
        totalMemoryUsage: 0,
        cleanupJobStatus: this.getJobStatus(),
      };
    }
  }

  /**
   * Force cleanup of all expired matches (for manual execution)
   */
  async forceCleanup(): Promise<CleanupMetrics> {
    console.log("[AI Match Cleanup] Force cleanup requested");
    return await this.runCleanup();
  }

  private getDefaultCleanupMetrics(): CleanupMetrics {
    return {
      totalMatchesScanned: 0,
      expiredMatchesFound: 0,
      matchesCleanedUp: 0,
      cleanupErrors: 0,
      memoryFreed: 0,
      cleanupDuration: 0,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const aiMatchCleanup = AIMatchCleanupManager.getInstance();

/**
 * Initialize cleanup job (call this in your app startup)
 */
export async function initializeCleanupJob(): Promise<void> {
  try {
    await aiMatchCleanup.startCleanupJob();
    console.log("[AI Match Cleanup] Cleanup job initialized successfully");
  } catch (error) {
    console.error("[AI Match Cleanup] Failed to initialize cleanup job:", error);
  }
}

/**
 * Graceful shutdown of cleanup job
 */
export function shutdownCleanupJob(): void {
  aiMatchCleanup.stopCleanupJob();
  console.log("[AI Match Cleanup] Cleanup job shutdown completed");
}

// =============================================================================
// LEGACY API COMPATIBILITY
// Functions expected by existing cron jobs and tests
// =============================================================================

export interface ScheduledCleanupOptions {
  deleteAbandonedOlderThanDays?: number;
  cleanupExpiredActive?: boolean;
  logResults?: boolean;
}

export interface ScheduledCleanupResult {
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
}

export interface CleanupRecommendation {
  recommended: boolean;
  reason?: string;
  metrics: {
    totalActiveMatches: number;
    recentAbandonments: number;
    cleanupRecommended: boolean;
  };
}

/**
 * Perform scheduled cleanup (called by Vercel cron job)
 * This integrates with the existing cron system to avoid exceeding daily limits
 */
export async function performScheduledCleanup(options: ScheduledCleanupOptions = {}): Promise<ScheduledCleanupResult> {
  const { deleteAbandonedOlderThanDays = 7, cleanupExpiredActive = true, logResults = true } = options;

  try {
    if (logResults) {
      console.log("[Scheduled Cleanup] Starting cleanup operation...");
    }

    // Use the new cleanup manager for the actual work
    const cleanupMetrics = await aiMatchCleanup.runCleanup();

    // Get abandonment metrics
    const abandonmentMetrics = await aiMatchManager.getAbandonmentMetrics();

    // Perform additional cleanup using existing aiMatchManager
    const matchCleanupResults = await aiMatchManager.performMatchCleanup({
      deleteAbandonedOlderThanDays,
      cleanupExpiredActive,
    });

    const results = {
      expiredActiveMatches: cleanupMetrics.matchesCleanedUp + matchCleanupResults.expiredActiveMatches,
      deletedAbandonedMatches: matchCleanupResults.deletedAbandonedMatches,
    };

    const metrics = {
      totalActiveMatches: abandonmentMetrics.totalActiveMatches,
      recentAbandonments: abandonmentMetrics.recentAbandonments,
      cleanupRecommended: abandonmentMetrics.cleanupRecommended,
    };

    if (logResults) {
      console.log("[Scheduled Cleanup] Cleanup completed:", {
        results,
        metrics,
        cleanupDuration: cleanupMetrics.cleanupDuration,
        memoryFreed: cleanupMetrics.memoryFreed,
      });
    }

    return {
      success: true,
      results,
      metrics,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Scheduled Cleanup] Cleanup failed:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get cleanup recommendation based on current system state
 */
export async function getCleanupRecommendation(): Promise<CleanupRecommendation> {
  try {
    // Get current system metrics
    const abandonmentMetrics = await aiMatchManager.getAbandonmentMetrics();
    const cleanupStats = await aiMatchCleanup.getCleanupStats();

    const totalActive = cleanupStats.totalMatchesInRedis;
    const estimatedExpired = cleanupStats.estimatedExpiredMatches;

    // Determine if cleanup is recommended
    let recommended = false;
    let reason: string | undefined;

    if (totalActive > 100) {
      recommended = true;
      reason = `High number of active matches (${totalActive})`;
    } else if (estimatedExpired > 20) {
      recommended = true;
      reason = `Many expired matches detected (${estimatedExpired})`;
    } else if (abandonmentMetrics.recentAbandonments > 10) {
      recommended = true;
      reason = `High recent abandonment rate (${abandonmentMetrics.recentAbandonments})`;
    }

    return {
      recommended,
      reason,
      metrics: {
        totalActiveMatches: totalActive,
        recentAbandonments: abandonmentMetrics.recentAbandonments,
        cleanupRecommended: recommended,
      },
    };
  } catch (error) {
    console.error("[Cleanup Recommendation] Error getting recommendation:", error);

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
 * Perform emergency cleanup with aggressive settings
 */
export async function performEmergencyCleanup(): Promise<ScheduledCleanupResult> {
  try {
    console.log("[Emergency Cleanup] Starting aggressive cleanup...");

    // Use aggressive settings for emergency cleanup
    const result = await performScheduledCleanup({
      deleteAbandonedOlderThanDays: 1, // Delete abandoned matches older than 1 day
      cleanupExpiredActive: true,
      logResults: true,
    });

    // Force additional cleanup using the new system
    const forceCleanupMetrics = await aiMatchCleanup.forceCleanup();

    if (result.success && result.results) {
      result.results.expiredActiveMatches += forceCleanupMetrics.matchesCleanedUp;
    }

    console.log("[Emergency Cleanup] Emergency cleanup completed");
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Emergency Cleanup] Emergency cleanup failed:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
