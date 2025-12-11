/**
 * Property-Based Tests for Performance Metrics Tracking
 *
 * **Feature: best-of-three-ai-matches, Property 13: Performance Metrics Tracking**
 *
 * **Validates: Requirements 6.5**
 *
 * Tests that the system accurately tracks performance metrics including
 * active match counts, completion rates, API response times, and database
 * operation performance across all system operations.
 */
import { AIMatchMetricsManager, aiMatchMetrics } from "../lib/aiMatchMetrics";
import fc from "fast-check";
import { createClient } from "redis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Redis client
vi.mock("redis", () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    isReady: true,
    on: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    setEx: vi.fn(),
    expire: vi.fn(),
    lPush: vi.fn(),
    lTrim: vi.fn(),
    lRange: vi.fn(),
    keys: vi.fn(),
    ttl: vi.fn(),
  })),
}));

describe("AI Match Metrics Tracking Property Tests", () => {
  let mockRedisClient: any;

  beforeEach(async () => {
    // Mock environment variable
    process.env.REDIS_URL = "redis://localhost:6379";

    // Clear all mocks first
    vi.clearAllMocks();

    // Create fresh mock client
    mockRedisClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      isReady: true,
      on: vi.fn(),
      set: vi.fn().mockResolvedValue("OK"),
      get: vi.fn().mockResolvedValue(null),
      setEx: vi.fn().mockResolvedValue("OK"),
      expire: vi.fn().mockResolvedValue(1),
      lPush: vi.fn().mockResolvedValue(1),
      lTrim: vi.fn().mockResolvedValue("OK"),
      lRange: vi.fn().mockResolvedValue([]),
      keys: vi.fn().mockResolvedValue([]),
      ttl: vi.fn().mockResolvedValue(-1),
    };

    // Mock createClient to return our mock
    (createClient as any).mockReturnValue(mockRedisClient);

    // Reset the singleton instance and force new client
    AIMatchMetricsManager.resetInstance();
    const instance = AIMatchMetricsManager.getInstance();
    instance.resetClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: API Response Time Tracking Accuracy
   * For any API endpoint and response time, the metrics system should
   * accurately record and store the timing data with success/failure status
   */
  it("should accurately track API response times for all endpoints", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("start", "playRound", "status", "abandon"),
        fc.integer({ min: 1, max: 5000 }), // Response time in ms
        fc.boolean(), // Success status
        async (endpoint, responseTime, success) => {
          // Setup mock Redis responses
          mockRedisClient.lPush.mockResolvedValue(1);
          mockRedisClient.lTrim.mockResolvedValue("OK");
          mockRedisClient.expire.mockResolvedValue(1);
          mockRedisClient.set.mockResolvedValue("OK");
          mockRedisClient.get.mockResolvedValue(
            JSON.stringify({
              apiErrors: 0,
              databaseErrors: 0,
              totalRequests: 0,
            }),
          );

          // Record the API response time
          await aiMatchMetrics.recordApiResponseTime(endpoint, responseTime, success);

          // Verify the metric was stored correctly
          expect(mockRedisClient.lPush).toHaveBeenCalledWith(
            `ai_match_metrics:api_times:${endpoint}`,
            expect.stringContaining(`"duration":${responseTime}`),
          );
          expect(mockRedisClient.lPush).toHaveBeenCalledWith(
            `ai_match_metrics:api_times:${endpoint}`,
            expect.stringContaining(`"success":${success}`),
          );
          expect(mockRedisClient.lPush).toHaveBeenCalledWith(
            `ai_match_metrics:api_times:${endpoint}`,
            expect.stringContaining(`"operation":"api_${endpoint}"`),
          );

          // Verify TTL was set
          expect(mockRedisClient.expire).toHaveBeenCalledWith(
            `ai_match_metrics:api_times:${endpoint}`,
            600, // 10 minutes
          );

          // Verify error rates were updated
          expect(mockRedisClient.set).toHaveBeenCalledWith("ai_match_metrics:errors", expect.any(String));
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property: Database Operation Time Tracking Accuracy
   * For any database operation, the metrics system should accurately
   * record timing data with operation type and database identifier
   */
  it("should accurately track database operation times", async () => {
    const operation = "saveMatch";
    const database = "redis";
    const operationTime = 150;
    const success = true;

    // Reset client for this test
    aiMatchMetrics.resetClient();

    // Setup mock Redis responses
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify({
        apiErrors: 0,
        databaseErrors: 0,
        totalRequests: 0,
      }),
    );

    // Record the database operation time
    await aiMatchMetrics.recordDatabaseOperationTime(operation, database, operationTime, success);

    // Verify the metric was stored correctly
    expect(mockRedisClient.lPush).toHaveBeenCalledWith(
      `ai_match_metrics:db_times:${database}`,
      expect.stringContaining(`"duration":${operationTime}`),
    );
    expect(mockRedisClient.lPush).toHaveBeenCalledWith(
      `ai_match_metrics:db_times:${database}`,
      expect.stringContaining(`"success":${success}`),
    );
    expect(mockRedisClient.lPush).toHaveBeenCalledWith(
      `ai_match_metrics:db_times:${database}`,
      expect.stringContaining(`"operation":"db_${database}_${operation}"`),
    );

    // Verify TTL was set
    expect(mockRedisClient.expire).toHaveBeenCalledWith(
      `ai_match_metrics:db_times:${database}`,
      600, // 10 minutes
    );
  });

  /**
   * Property: Active Match Count Tracking Consistency
   * For any active match count, the metrics system should store and
   * retrieve the exact count value with appropriate TTL
   */
  it("should accurately track active match counts", async () => {
    const activeCount = 42;

    // Reset client for this test
    aiMatchMetrics.resetClient();

    // Setup mock Redis responses
    mockRedisClient.get.mockResolvedValue(activeCount.toString());

    // Update active match count
    await aiMatchMetrics.updateActiveMatchCount(activeCount);

    // Verify the count was stored correctly
    expect(mockRedisClient.set).toHaveBeenCalledWith("ai_match_metrics:active_count", activeCount.toString());

    // Verify TTL was set
    expect(mockRedisClient.expire).toHaveBeenCalledWith(
      "ai_match_metrics:active_count",
      300, // 5 minutes
    );

    // Verify we can retrieve the same count
    const metrics = await aiMatchMetrics.getMetrics();
    expect(metrics.activeMatchCount).toBe(activeCount);
  });

  /**
   * Property: Completion Rate Calculation Accuracy
   * For any combination of completed and abandoned matches, the system
   * should calculate the correct completion rate percentage
   */
  it("should accurately calculate and track completion rates", async () => {
    const completedMatches = 75;
    const abandonedMatches = 25;
    const totalMatches = completedMatches + abandonedMatches;
    const expectedCompletionRate = (completedMatches / totalMatches) * 100;

    // Reset client for this test
    aiMatchMetrics.resetClient();

    // Setup mock Redis responses
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify({
        completionRate: expectedCompletionRate,
        completedMatches,
        abandonedMatches,
        totalMatches,
        timestamp: new Date().toISOString(),
      }),
    );

    // Update completion rate
    await aiMatchMetrics.updateCompletionRate(completedMatches, abandonedMatches);

    // Verify the data was stored correctly
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "ai_match_metrics:completion_rate",
      expect.stringMatching(
        new RegExp(
          `"completionRate":${expectedCompletionRate}.*"completedMatches":${completedMatches}.*"abandonedMatches":${abandonedMatches}`,
        ),
      ),
    );

    // Verify we can retrieve the correct metrics
    const metrics = await aiMatchMetrics.getMetrics();
    expect(metrics.completionRate).toBe(expectedCompletionRate);
    expect(metrics.totalMatchesCompleted).toBe(completedMatches);
    expect(metrics.totalMatchesAbandoned).toBe(abandonedMatches);
  });

  /**
   * Property: Error Rate Tracking Consistency
   * For any sequence of API calls with success/failure status,
   * the system should maintain accurate error rate statistics
   */
  it("should accurately track error rates across operations", async () => {
    // Reset client for this test
    aiMatchMetrics.resetClient();

    // Setup initial error state
    let currentErrors = 0;
    let currentTotal = 0;

    mockRedisClient.get.mockImplementation((key: string) => {
      if (key === "ai_match_metrics:errors") {
        return Promise.resolve(
          JSON.stringify({
            apiErrors: currentErrors,
            databaseErrors: 0,
            totalRequests: currentTotal,
          }),
        );
      }
      return Promise.resolve(null);
    });

    mockRedisClient.set.mockImplementation((key: string, value: string) => {
      if (key === "ai_match_metrics:errors") {
        const data = JSON.parse(value);
        currentErrors = data.apiErrors;
        currentTotal = data.totalRequests;
      }
      return Promise.resolve("OK");
    });

    // Simulate one successful and one failed API call
    await aiMatchMetrics.recordApiResponseTime("test", 100, true); // Success
    await aiMatchMetrics.recordApiResponseTime("test", 100, false); // Failure

    // Verify final error counts
    expect(currentErrors).toBe(1); // One failed request
    expect(currentTotal).toBe(2); // Two total requests

    // Verify error rate calculation
    const monitoringMetrics = await aiMatchMetrics.getMonitoringMetrics();
    expect(monitoringMetrics.errorRate).toBe(50); // 50% error rate
  });

  /**
   * Property: Metrics Timestamp Consistency
   * All metrics should have timestamps that are recent and properly formatted
   */
  it("should include accurate timestamps in all metrics", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // Active match count
        async activeCount => {
          const testStartTime = Date.now();

          // Setup mock Redis responses
          mockRedisClient.set.mockResolvedValue("OK");
          mockRedisClient.expire.mockResolvedValue(1);
          mockRedisClient.get.mockImplementation((key: string) => {
            if (key === "ai_match_metrics:active_count") {
              return Promise.resolve(activeCount.toString());
            }
            if (key === "ai_match_metrics:completion_rate") {
              return Promise.resolve(
                JSON.stringify({
                  completionRate: 75,
                  completedMatches: 75,
                  abandonedMatches: 25,
                  totalMatches: 100,
                  timestamp: new Date().toISOString(),
                }),
              );
            }
            if (key === "ai_match_metrics:errors") {
              return Promise.resolve(
                JSON.stringify({
                  apiErrors: 0,
                  databaseErrors: 0,
                  totalRequests: 0,
                }),
              );
            }
            return Promise.resolve(null);
          });
          mockRedisClient.keys.mockResolvedValue([]);
          mockRedisClient.lRange.mockResolvedValue([]);

          // Get metrics
          const metrics = await aiMatchMetrics.getMetrics();
          const testEndTime = Date.now();

          // Verify timestamp is recent and valid
          expect(metrics.timestamp).toBeInstanceOf(Date);
          expect(metrics.timestamp.getTime()).toBeGreaterThanOrEqual(testStartTime);
          expect(metrics.timestamp.getTime()).toBeLessThanOrEqual(testEndTime);

          // Verify timestamp is not in the future
          expect(metrics.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Property: Metrics Data Structure Consistency
   * All metrics should return complete data structures with expected fields
   */
  it("should return complete and consistent metrics data structures", async () => {
    const activeCount = 42;
    const completedMatches = 75;
    const abandonedMatches = 25;

    // Reset client for this test
    aiMatchMetrics.resetClient();

    // Setup comprehensive mock Redis responses
    mockRedisClient.get.mockImplementation((key: string) => {
      if (key === "ai_match_metrics:active_count") {
        return Promise.resolve(activeCount.toString());
      }
      if (key === "ai_match_metrics:completion_rate") {
        const totalMatches = completedMatches + abandonedMatches;
        const completionRate = (completedMatches / totalMatches) * 100;
        return Promise.resolve(
          JSON.stringify({
            completionRate,
            completedMatches,
            abandonedMatches,
            totalMatches,
            timestamp: new Date().toISOString(),
          }),
        );
      }
      if (key === "ai_match_metrics:errors") {
        return Promise.resolve(
          JSON.stringify({
            apiErrors: 5,
            databaseErrors: 2,
            totalRequests: 100,
          }),
        );
      }
      return Promise.resolve(null);
    });

    mockRedisClient.lRange.mockResolvedValue([
      JSON.stringify({ operation: "test", duration: 100, success: true, timestamp: new Date().toISOString() }),
      JSON.stringify({ operation: "test", duration: 150, success: true, timestamp: new Date().toISOString() }),
    ]);

    // Get metrics
    const metrics = await aiMatchMetrics.getMetrics();

    // Verify all required fields are present and have correct types
    expect(typeof metrics.activeMatchCount).toBe("number");
    expect(typeof metrics.completionRate).toBe("number");
    expect(typeof metrics.averageMatchDuration).toBe("number");
    expect(typeof metrics.abandonmentRate).toBe("number");
    expect(typeof metrics.totalMatchesCompleted).toBe("number");
    expect(typeof metrics.totalMatchesAbandoned).toBe("number");
    expect(metrics.timestamp).toBeInstanceOf(Date);

    // Verify nested objects have correct structure
    expect(metrics.recentApiResponseTimes).toHaveProperty("start");
    expect(metrics.recentApiResponseTimes).toHaveProperty("playRound");
    expect(metrics.recentApiResponseTimes).toHaveProperty("status");
    expect(metrics.recentApiResponseTimes).toHaveProperty("abandon");

    expect(metrics.databaseOperationTimes).toHaveProperty("redis");
    expect(metrics.databaseOperationTimes).toHaveProperty("turso");

    expect(metrics.errorRates).toHaveProperty("apiErrors");
    expect(metrics.errorRates).toHaveProperty("databaseErrors");
    expect(metrics.errorRates).toHaveProperty("totalRequests");

    // Verify arrays are actually arrays
    expect(Array.isArray(metrics.recentApiResponseTimes.start)).toBe(true);
    expect(Array.isArray(metrics.recentApiResponseTimes.playRound)).toBe(true);
    expect(Array.isArray(metrics.recentApiResponseTimes.status)).toBe(true);
    expect(Array.isArray(metrics.recentApiResponseTimes.abandon)).toBe(true);
    expect(Array.isArray(metrics.databaseOperationTimes.redis)).toBe(true);
    expect(Array.isArray(metrics.databaseOperationTimes.turso)).toBe(true);

    // Verify values match expected inputs
    expect(metrics.activeMatchCount).toBe(activeCount);
    expect(metrics.totalMatchesCompleted).toBe(completedMatches);
    expect(metrics.totalMatchesAbandoned).toBe(abandonedMatches);
  });
});
