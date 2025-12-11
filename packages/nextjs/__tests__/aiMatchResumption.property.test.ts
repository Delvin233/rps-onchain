/**
 * Property Test: Match Resumption Detection
 *
 * Property 6: Match Resumption Detection
 * Validates: Requirements 4.2
 *
 * This property test ensures that match resumption works correctly by testing
 * the core properties of the resumption system without making assumptions
 * about specific implementation details.
 */
// Import AIMatchManager after mocking
import { aiMatchManager } from "../lib/aiMatchManager";
import { getActiveMatchForPlayer } from "../lib/aiMatchStorage";
import { AIMatch, MatchStatus } from "../types/aiMatch";
import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Redis and database operations
vi.mock("../lib/aiMatchStorage", async importOriginal => {
  const actual = await importOriginal<typeof import("../lib/aiMatchStorage")>();
  return {
    ...actual,
    getActiveMatchForPlayer: vi.fn(),
    getActiveMatchFromRedis: vi.fn(),
    saveActiveMatchToRedis: vi.fn(),
    completeMatch: vi.fn(),
    getAllActiveMatches: vi.fn(),
    getPlayerMatchStats: vi.fn(),
  };
});

// Mock the AI Match Metrics to prevent Redis connection issues
vi.mock("../lib/aiMatchMetrics", () => ({
  aiMatchMetrics: {
    updateActiveMatchCount: vi.fn(),
    recordApiResponseTime: vi.fn(),
    recordDatabaseOperationTime: vi.fn(),
    incrementErrorCount: vi.fn(),
    getMetrics: vi.fn().mockResolvedValue({
      activeMatchCount: 0,
      completionRate: 0,
      averageMatchDuration: 0,
      abandonmentRate: 0,
      totalMatchesCompleted: 0,
      totalMatchesAbandoned: 0,
      recentApiResponseTimes: { start: [], playRound: [], status: [], abandon: [] },
      databaseOperationTimes: { redis: [], turso: [] },
      errorRates: { apiErrors: 0, databaseErrors: 0, redisErrors: 0 },
    }),
  },
  withDatabaseMetricsTracking: vi.fn((operation, database, fn) => fn),
}));

const mockGetActiveMatchForPlayer = getActiveMatchForPlayer as ReturnType<typeof vi.fn>;

// Generators for property testing
const playerIdGen = fc.string({ minLength: 10, maxLength: 42 }).map(s => `0x${s}`);

const matchIdGen = fc.string({ minLength: 8, maxLength: 20 }).map(s => `match_${s}`);

// Simple active match generator that creates consistent data
const createValidMatch = (playerId: string, matchId: string): AIMatch => ({
  id: matchId,
  playerId,
  status: MatchStatus.ACTIVE,
  playerScore: 0,
  aiScore: 0,
  currentRound: 1,
  rounds: [],
  startedAt: new Date(),
  lastActivityAt: new Date(),
  isAbandoned: false,
});

describe("Property Test: Match Resumption Detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Property 6.1: Players can resume their active matches", async () => {
    await fc.assert(
      fc.asyncProperty(fc.tuple(playerIdGen, matchIdGen), async ([playerId, matchId]) => {
        const activeMatch = createValidMatch(playerId, matchId);
        mockGetActiveMatchForPlayer.mockResolvedValue(activeMatch);

        // Test resumption
        const resumedMatch = await aiMatchManager.getActiveMatchForPlayer(playerId);

        // Verify match can be resumed
        expect(resumedMatch).not.toBeNull();
        expect(resumedMatch?.id).toBe(matchId);
        expect(resumedMatch?.playerId).toBe(playerId);
        expect(resumedMatch?.status).toBe(MatchStatus.ACTIVE);
      }),
      { numRuns: 50 },
    );
  });

  it("Property 6.2: No active match returns null for resumption", async () => {
    await fc.assert(
      fc.asyncProperty(playerIdGen, async playerId => {
        mockGetActiveMatchForPlayer.mockResolvedValue(null);

        // Test resumption when no active match exists
        const resumedMatch = await aiMatchManager.getActiveMatchForPlayer(playerId);

        // Verify no match is returned
        expect(resumedMatch).toBeNull();
      }),
      { numRuns: 30 },
    );
  });

  it("Property 6.3: Match resumption calls storage layer correctly", async () => {
    await fc.assert(
      fc.asyncProperty(fc.tuple(playerIdGen, matchIdGen), async ([playerId, matchId]) => {
        // Clear mocks for this specific test run
        mockGetActiveMatchForPlayer.mockClear();

        const activeMatch = createValidMatch(playerId, matchId);
        mockGetActiveMatchForPlayer.mockResolvedValue(activeMatch);

        // Test resumption
        await aiMatchManager.getActiveMatchForPlayer(playerId);

        // Verify storage layer was called correctly
        expect(mockGetActiveMatchForPlayer).toHaveBeenCalledWith(playerId);
        expect(mockGetActiveMatchForPlayer).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 30 },
    );
  });

  it("Property 6.4: Match resumption preserves match identity", async () => {
    await fc.assert(
      fc.asyncProperty(fc.tuple(playerIdGen, matchIdGen), async ([playerId, matchId]) => {
        const activeMatch = createValidMatch(playerId, matchId);
        mockGetActiveMatchForPlayer.mockResolvedValue(activeMatch);

        // Test resumption
        const resumedMatch = await aiMatchManager.getActiveMatchForPlayer(playerId);

        // Verify match identity is preserved
        expect(resumedMatch).not.toBeNull();
        expect(resumedMatch?.id).toBe(activeMatch.id);
        expect(resumedMatch?.playerId).toBe(activeMatch.playerId);
        expect(resumedMatch?.status).toBe(activeMatch.status);
      }),
      { numRuns: 40 },
    );
  });

  it("Property 6.5: Different players get different matches", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(playerIdGen, playerIdGen, matchIdGen, matchIdGen).filter(([p1, p2]) => p1 !== p2),
        async ([playerId1, playerId2, matchId1, matchId2]) => {
          const match1 = createValidMatch(playerId1, matchId1);
          const match2 = createValidMatch(playerId2, matchId2);

          mockGetActiveMatchForPlayer.mockImplementation((pid: string) => {
            if (pid === playerId1) return Promise.resolve(match1);
            if (pid === playerId2) return Promise.resolve(match2);
            return Promise.resolve(null);
          });

          // Test resumption for both players
          const resumedMatch1 = await aiMatchManager.getActiveMatchForPlayer(playerId1);
          const resumedMatch2 = await aiMatchManager.getActiveMatchForPlayer(playerId2);

          // Verify each player gets their own match
          expect(resumedMatch1?.playerId).toBe(playerId1);
          expect(resumedMatch2?.playerId).toBe(playerId2);
          expect(resumedMatch1?.id).toBe(matchId1);
          expect(resumedMatch2?.id).toBe(matchId2);
        },
      ),
      { numRuns: 30 },
    );
  });

  it("Property 6.6: Match resumption is consistent across multiple calls", async () => {
    await fc.assert(
      fc.asyncProperty(fc.tuple(playerIdGen, matchIdGen), async ([playerId, matchId]) => {
        const activeMatch = createValidMatch(playerId, matchId);
        mockGetActiveMatchForPlayer.mockResolvedValue(activeMatch);

        // Test multiple resumption calls
        const resumedMatch1 = await aiMatchManager.getActiveMatchForPlayer(playerId);
        const resumedMatch2 = await aiMatchManager.getActiveMatchForPlayer(playerId);

        // Verify consistency
        expect(resumedMatch1).not.toBeNull();
        expect(resumedMatch2).not.toBeNull();
        expect(resumedMatch1?.id).toBe(resumedMatch2?.id);
        expect(resumedMatch1?.playerId).toBe(resumedMatch2?.playerId);
        expect(resumedMatch1?.status).toBe(resumedMatch2?.status);
      }),
      { numRuns: 30 },
    );
  });
});
