/**
 * AI Match Performance Metrics
 *
 * This module provides performance monitoring and metrics collection
 * for the AI match system, tracking active matches, completion rates,
 * API response times, and database operation performance.
 */
import { createClient } from "redis";

// Metrics interfaces
export interface MatchMetrics {
  activeMatchCount: number;
  completionRate: number;
  averageMatchDuration: number;
  abandonmentRate: number;
  totalMatchesCompleted: number;
  totalMatchesAbandoned: number;
  recentApiResponseTimes: {
    start: number[];
    playRound: number[];
    status: number[];
    abandon: number[];
  };
  databaseOperationTimes: {
    redis: number[];
    turso: number[];
  };
  errorRates: {
    apiErrors: number;
    databaseErrors: number;
    totalRequests: number;
  };
  timestamp: Date;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Redis keys for metrics storage
const METRICS_KEYS = {
  ACTIVE_MATCHES: "ai_match_metrics:active_count",
  COMPLETION_RATE: "ai_match_metrics:completion_rate",
  API_RESPONSE_TIMES: "ai_match_metrics:api_times",
  DB_OPERATION_TIMES: "ai_match_metrics:db_times",
  ERROR_RATES: "ai_match_metrics:errors",
  RECENT_METRICS: "ai_match_metrics:recent",
} as const;

// Metrics collection window (in seconds)
const METRICS_WINDOW = 300; // 5 minutes
const MAX_STORED_METRICS = 100;

/**
 * AI Match Metrics Manager
 * Handles collection, storage, and retrieval of performance metrics
 */
export class AIMatchMetricsManager {
  private static instance: AIMatchMetricsManager;
  private client: ReturnType<typeof createClient> | null = null;
  private connecting = false;
  private connectionPromise: Promise<ReturnType<typeof createClient>> | null = null;

  static getInstance(): AIMatchMetricsManager {
    if (!AIMatchMetricsManager.instance) {
      AIMatchMetricsManager.instance = new AIMatchMetricsManager();
    }
    return AIMatchMetricsManager.instance;
  }

  // Method for testing - resets the singleton instance
  static resetInstance(): void {
    AIMatchMetricsManager.instance = new AIMatchMetricsManager();
  }

  // Method for testing - forces a new client connection
  resetClient(): void {
    this.client = null;
    this.connecting = false;
    this.connectionPromise = null;
  }

  private async getClient(): Promise<ReturnType<typeof createClient>> {
    if (this.client && this.client.isReady) {
      return this.client;
    }

    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = this.connect();

    try {
      this.client = await this.connectionPromise;
      return this.client;
    } finally {
      this.connecting = false;
      this.connectionPromise = null;
    }
  }

  private async connect(): Promise<ReturnType<typeof createClient>> {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: retries => Math.min(retries * 50, 1000),
      },
    });

    client.on("error", err => {
      console.error("[AI Match Metrics] Redis connection error:", err);
    });

    await client.connect();
    console.log("[AI Match Metrics] Redis connected successfully");
    return client;
  }

  /**
   * Record API response time metric
   */
  async recordApiResponseTime(endpoint: string, duration: number, success: boolean): Promise<void> {
    try {
      const client = await this.getClient();
      const metric: PerformanceMetric = {
        operation: `api_${endpoint}`,
        duration,
        success,
        timestamp: new Date(),
        metadata: { endpoint },
      };

      // Store in time-series format
      const key = `${METRICS_KEYS.API_RESPONSE_TIMES}:${endpoint}`;
      await client.lPush(key, JSON.stringify(metric));
      await client.lTrim(key, 0, MAX_STORED_METRICS - 1);
      await client.expire(key, METRICS_WINDOW * 2); // Keep for 10 minutes

      // Update error rates
      await this.updateErrorRates(success);
    } catch (error) {
      console.error("[AI Match Metrics] Error recording API response time:", error);
    }
  }

  /**
   * Record database operation time metric
   */
  async recordDatabaseOperationTime(
    operation: string,
    database: "redis" | "turso",
    duration: number,
    success: boolean,
  ): Promise<void> {
    try {
      const client = await this.getClient();
      const metric: PerformanceMetric = {
        operation: `db_${database}_${operation}`,
        duration,
        success,
        timestamp: new Date(),
        metadata: { database, operation },
      };

      const key = `${METRICS_KEYS.DB_OPERATION_TIMES}:${database}`;
      await client.lPush(key, JSON.stringify(metric));
      await client.lTrim(key, 0, MAX_STORED_METRICS - 1);
      await client.expire(key, METRICS_WINDOW * 2);

      // Update error rates for database operations
      if (!success) {
        await this.incrementErrorCount("database");
      }
    } catch (error) {
      console.error("[AI Match Metrics] Error recording database operation time:", error);
    }
  }

  /**
   * Update active match count
   */
  async updateActiveMatchCount(count: number): Promise<void> {
    try {
      const client = await this.getClient();
      await client.set(METRICS_KEYS.ACTIVE_MATCHES, count.toString());
      await client.expire(METRICS_KEYS.ACTIVE_MATCHES, METRICS_WINDOW);
    } catch (error) {
      console.error("[AI Match Metrics] Error updating active match count:", error);
    }
  }

  /**
   * Update completion rate metrics
   */
  async updateCompletionRate(completedMatches: number, abandonedMatches: number): Promise<void> {
    try {
      const client = await this.getClient();
      const totalMatches = completedMatches + abandonedMatches;
      const completionRate = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

      const data = {
        completionRate,
        completedMatches,
        abandonedMatches,
        totalMatches,
        timestamp: new Date().toISOString(),
      };

      await client.set(METRICS_KEYS.COMPLETION_RATE, JSON.stringify(data));
      await client.expire(METRICS_KEYS.COMPLETION_RATE, METRICS_WINDOW);
    } catch (error) {
      console.error("[AI Match Metrics] Error updating completion rate:", error);
    }
  }

  /**
   * Get current performance metrics
   */
  async getMetrics(): Promise<MatchMetrics> {
    try {
      const client = await this.getClient();

      // Get active match count
      const activeCountStr = await client.get(METRICS_KEYS.ACTIVE_MATCHES);
      const activeMatchCount = activeCountStr ? parseInt(activeCountStr, 10) : 0;

      // Get completion rate data
      const completionRateStr = await client.get(METRICS_KEYS.COMPLETION_RATE);
      const completionData = completionRateStr
        ? JSON.parse(completionRateStr)
        : {
            completionRate: 0,
            completedMatches: 0,
            abandonedMatches: 0,
          };

      // Get API response times
      const apiTimes = await this.getRecentApiTimes();

      // Get database operation times
      const dbTimes = await this.getRecentDatabaseTimes();

      // Get error rates
      const errorRates = await this.getErrorRates();

      // Calculate average match duration (simplified - in production you'd track this more precisely)
      const averageMatchDuration = this.calculateAverageResponseTime(apiTimes.playRound) * 3; // Rough estimate

      return {
        activeMatchCount,
        completionRate: completionData.completionRate,
        averageMatchDuration,
        abandonmentRate:
          completionData.totalMatches > 0 ? (completionData.abandonedMatches / completionData.totalMatches) * 100 : 0,
        totalMatchesCompleted: completionData.completedMatches,
        totalMatchesAbandoned: completionData.abandonedMatches,
        recentApiResponseTimes: apiTimes,
        databaseOperationTimes: dbTimes,
        errorRates,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("[AI Match Metrics] Error getting metrics:", error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get metrics for monitoring dashboard
   */
  async getMonitoringMetrics(): Promise<{
    activeMatches: number;
    completionRate: number;
    errorRate: number;
    averageApiResponseTime: number;
    averageDbResponseTime: number;
    alertsTriggered: string[];
  }> {
    try {
      const metrics = await this.getMetrics();
      const alerts: string[] = [];

      // Check for alerts
      if (metrics.activeMatchCount > 1000) {
        alerts.push("High active match count");
      }
      if (metrics.completionRate < 70) {
        alerts.push("Low completion rate");
      }
      if (
        metrics.errorRates.totalRequests > 0 &&
        (metrics.errorRates.apiErrors + metrics.errorRates.databaseErrors) / metrics.errorRates.totalRequests > 0.05
      ) {
        alerts.push("High error rate");
      }

      const avgApiTime = this.calculateAverageResponseTime([
        ...metrics.recentApiResponseTimes.start,
        ...metrics.recentApiResponseTimes.playRound,
        ...metrics.recentApiResponseTimes.status,
        ...metrics.recentApiResponseTimes.abandon,
      ]);

      const avgDbTime = this.calculateAverageResponseTime([
        ...metrics.databaseOperationTimes.redis,
        ...metrics.databaseOperationTimes.turso,
      ]);

      return {
        activeMatches: metrics.activeMatchCount,
        completionRate: metrics.completionRate,
        errorRate:
          metrics.errorRates.totalRequests > 0
            ? ((metrics.errorRates.apiErrors + metrics.errorRates.databaseErrors) / metrics.errorRates.totalRequests) *
              100
            : 0,
        averageApiResponseTime: avgApiTime,
        averageDbResponseTime: avgDbTime,
        alertsTriggered: alerts,
      };
    } catch (error) {
      console.error("[AI Match Metrics] Error getting monitoring metrics:", error);
      return {
        activeMatches: 0,
        completionRate: 0,
        errorRate: 0,
        averageApiResponseTime: 0,
        averageDbResponseTime: 0,
        alertsTriggered: ["Metrics collection error"],
      };
    }
  }

  /**
   * Clear old metrics (cleanup function)
   */
  async clearOldMetrics(): Promise<void> {
    try {
      const client = await this.getClient();
      const keys = await client.keys("ai_match_metrics:*");

      for (const key of keys) {
        const ttl = await client.ttl(key);
        if (ttl === -1) {
          // No expiration set
          await client.expire(key, METRICS_WINDOW);
        }
      }
    } catch (error) {
      console.error("[AI Match Metrics] Error clearing old metrics:", error);
    }
  }

  // Private helper methods

  private async getRecentApiTimes(): Promise<MatchMetrics["recentApiResponseTimes"]> {
    try {
      const client = await this.getClient();
      const endpoints = ["start", "playRound", "status", "abandon"];
      const result: MatchMetrics["recentApiResponseTimes"] = {
        start: [],
        playRound: [],
        status: [],
        abandon: [],
      };

      for (const endpoint of endpoints) {
        const key = `${METRICS_KEYS.API_RESPONSE_TIMES}:${endpoint}`;
        const metrics = await client.lRange(key, 0, 19); // Get last 20 metrics
        result[endpoint as keyof typeof result] = (metrics || [])
          .map(m => {
            try {
              const parsed = JSON.parse(m) as PerformanceMetric;
              return parsed.duration;
            } catch {
              return 0;
            }
          })
          .filter(d => d > 0);
      }

      return result;
    } catch (error) {
      console.error("[AI Match Metrics] Error getting API times:", error);
      return { start: [], playRound: [], status: [], abandon: [] };
    }
  }

  private async getRecentDatabaseTimes(): Promise<MatchMetrics["databaseOperationTimes"]> {
    try {
      const client = await this.getClient();
      const databases = ["redis", "turso"];
      const result: MatchMetrics["databaseOperationTimes"] = {
        redis: [],
        turso: [],
      };

      for (const db of databases) {
        const key = `${METRICS_KEYS.DB_OPERATION_TIMES}:${db}`;
        const metrics = await client.lRange(key, 0, 19);
        result[db as keyof typeof result] = (metrics || [])
          .map(m => {
            try {
              const parsed = JSON.parse(m) as PerformanceMetric;
              return parsed.duration;
            } catch {
              return 0;
            }
          })
          .filter(d => d > 0);
      }

      return result;
    } catch (error) {
      console.error("[AI Match Metrics] Error getting database times:", error);
      return { redis: [], turso: [] };
    }
  }

  private async getErrorRates(): Promise<MatchMetrics["errorRates"]> {
    try {
      const client = await this.getClient();
      const errorDataStr = await client.get(METRICS_KEYS.ERROR_RATES);

      if (errorDataStr) {
        return JSON.parse(errorDataStr);
      }

      return { apiErrors: 0, databaseErrors: 0, totalRequests: 0 };
    } catch (error) {
      console.error("[AI Match Metrics] Error getting error rates:", error);
      return { apiErrors: 0, databaseErrors: 0, totalRequests: 0 };
    }
  }

  private async updateErrorRates(success: boolean): Promise<void> {
    try {
      const client = await this.getClient();
      const currentData = await this.getErrorRates();

      const updatedData = {
        apiErrors: success ? currentData.apiErrors : currentData.apiErrors + 1,
        databaseErrors: currentData.databaseErrors,
        totalRequests: currentData.totalRequests + 1,
      };

      await client.set(METRICS_KEYS.ERROR_RATES, JSON.stringify(updatedData));
      await client.expire(METRICS_KEYS.ERROR_RATES, METRICS_WINDOW);
    } catch (error) {
      console.error("[AI Match Metrics] Error updating error rates:", error);
    }
  }

  private async incrementErrorCount(type: "api" | "database"): Promise<void> {
    try {
      const client = await this.getClient();
      const currentData = await this.getErrorRates();

      const updatedData = {
        ...currentData,
        [type === "api" ? "apiErrors" : "databaseErrors"]:
          currentData[type === "api" ? "apiErrors" : "databaseErrors"] + 1,
      };

      await client.set(METRICS_KEYS.ERROR_RATES, JSON.stringify(updatedData));
      await client.expire(METRICS_KEYS.ERROR_RATES, METRICS_WINDOW);
    } catch (error) {
      console.error("[AI Match Metrics] Error incrementing error count:", error);
    }
  }

  private calculateAverageResponseTime(times: number[]): number {
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  private getDefaultMetrics(): MatchMetrics {
    return {
      activeMatchCount: 0,
      completionRate: 0,
      averageMatchDuration: 0,
      abandonmentRate: 0,
      totalMatchesCompleted: 0,
      totalMatchesAbandoned: 0,
      recentApiResponseTimes: {
        start: [],
        playRound: [],
        status: [],
        abandon: [],
      },
      databaseOperationTimes: {
        redis: [],
        turso: [],
      },
      errorRates: {
        apiErrors: 0,
        databaseErrors: 0,
        totalRequests: 0,
      },
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const aiMatchMetrics = AIMatchMetricsManager.getInstance();

/**
 * Middleware function to track API response times
 */
export function withMetricsTracking<T extends (...args: any[]) => Promise<any>>(endpoint: string, handler: T): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let success = true;

    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      await aiMatchMetrics.recordApiResponseTime(endpoint, duration, success);
    }
  }) as T;
}

/**
 * Middleware function to track database operation times
 */
export function withDatabaseMetricsTracking<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  database: "redis" | "turso",
  handler: T,
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let success = true;

    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      await aiMatchMetrics.recordDatabaseOperationTime(operation, database, duration, success);
    }
  }) as T;
}
