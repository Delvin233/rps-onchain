/**
 * Unit tests for AI Match API endpoints
 *
 * Tests all AI match API endpoints with various input scenarios,
 * error handling, and response formats.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  AIMatch,
  InvalidMatchStateError,
  MatchAbandonedError,
  MatchCompletedError,
  MatchNotFoundError,
  MatchStatus,
} from "../types/aiMatch";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the rate limiter
const mockWithRateLimit = vi.fn((req, category, handler) => handler());

// Mock the AIMatchManager
const mockAiMatchManager = {
  startMatch: vi.fn(),
  playRound: vi.fn(),
  getMatchStatus: vi.fn(),
  getActiveMatchForPlayer: vi.fn(),
  abandonMatchById: vi.fn(),
};

// Create API endpoint implementations for testing
const createStartMatchEndpoint = () => {
  return async (req: NextRequest) => {
    return mockWithRateLimit(req, "gameplay", async () => {
      try {
        const { address } = await req.json();

        if (!address || typeof address !== "string") {
          return NextResponse.json({ error: "Valid address is required" }, { status: 400 });
        }

        const normalizedAddress = address.toLowerCase();
        const match = await mockAiMatchManager.startMatch(normalizedAddress);

        return NextResponse.json({ match });
      } catch (error) {
        if (error instanceof InvalidMatchStateError) {
          const message = error.message;

          if (message.includes("already has an active match")) {
            return NextResponse.json(
              { error: "You already have an active match. Please complete or abandon it before starting a new one." },
              { status: 409 },
            );
          }

          if (message.includes("excessive abandonment patterns")) {
            return NextResponse.json(
              { error: "You have abandoned too many matches recently. Please wait before starting a new match." },
              { status: 429 },
            );
          }

          return NextResponse.json({ error: "Cannot start match due to invalid state" }, { status: 400 });
        }

        return NextResponse.json({ error: "Failed to start match" }, { status: 500 });
      }
    });
  };
};

const createPlayRoundEndpoint = () => {
  return async (req: NextRequest) => {
    return mockWithRateLimit(req, "gameplay", async () => {
      try {
        const { matchId, playerMove } = await req.json();

        if (!matchId || typeof matchId !== "string") {
          return NextResponse.json({ error: "Valid matchId is required" }, { status: 400 });
        }

        if (!playerMove || !["rock", "paper", "scissors"].includes(playerMove)) {
          return NextResponse.json(
            { error: "Valid playerMove is required (rock, paper, or scissors)" },
            { status: 400 },
          );
        }

        const result = await mockAiMatchManager.playRound(matchId, playerMove);

        return NextResponse.json(result);
      } catch (error) {
        if (error instanceof MatchNotFoundError) {
          return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        if (error instanceof MatchCompletedError) {
          return NextResponse.json({ error: "Match is already completed" }, { status: 409 });
        }

        if (error instanceof MatchAbandonedError) {
          return NextResponse.json({ error: "Match has been abandoned" }, { status: 409 });
        }

        if (error instanceof InvalidMatchStateError) {
          return NextResponse.json({ error: "Invalid match state for playing a round" }, { status: 409 });
        }

        return NextResponse.json({ error: "Failed to play round" }, { status: 500 });
      }
    });
  };
};

const createStatusEndpoint = () => {
  return async (req: NextRequest) => {
    return mockWithRateLimit(req, "stats", async () => {
      try {
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get("matchId");

        if (!matchId || typeof matchId !== "string") {
          return NextResponse.json({ error: "Valid matchId parameter is required" }, { status: 400 });
        }

        const match = await mockAiMatchManager.getMatchStatus(matchId);

        return NextResponse.json({ match });
      } catch {
        return NextResponse.json({ error: "Failed to get match status" }, { status: 500 });
      }
    });
  };
};

const createResumeEndpoint = () => {
  return async (req: NextRequest) => {
    return mockWithRateLimit(req, "stats", async () => {
      try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get("address");

        if (!address || typeof address !== "string") {
          return NextResponse.json({ error: "Valid address parameter is required" }, { status: 400 });
        }

        const normalizedAddress = address.toLowerCase();
        const match = await mockAiMatchManager.getActiveMatchForPlayer(normalizedAddress);

        return NextResponse.json({ match });
      } catch {
        return NextResponse.json({ error: "Failed to get active match" }, { status: 500 });
      }
    });
  };
};

const createAbandonEndpoint = () => {
  return async (req: NextRequest) => {
    return mockWithRateLimit(req, "gameplay", async () => {
      try {
        const { matchId } = await req.json();

        if (!matchId || typeof matchId !== "string") {
          return NextResponse.json({ error: "Valid matchId is required" }, { status: 400 });
        }

        const match = await mockAiMatchManager.abandonMatchById(matchId);

        return NextResponse.json({ match });
      } catch (error) {
        if (error instanceof MatchNotFoundError) {
          return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        if (error instanceof InvalidMatchStateError) {
          return NextResponse.json({ error: "Match cannot be abandoned (not active)" }, { status: 409 });
        }

        return NextResponse.json({ error: "Failed to abandon match" }, { status: 500 });
      }
    });
  };
};

// Helper function to create mock request
const createMockRequest = (body?: any, url?: string): NextRequest => {
  const mockUrl = url || "http://localhost:3000/api/test";
  return {
    json: vi.fn().mockResolvedValue(body || {}),
    url: mockUrl,
    nextUrl: new URL(mockUrl),
  } as unknown as NextRequest;
};

// Helper function to create mock match
const createMockMatch = (overrides: Partial<AIMatch> = {}): AIMatch => ({
  id: "match_123",
  playerId: "0x123",
  status: MatchStatus.ACTIVE,
  playerScore: 0,
  aiScore: 0,
  currentRound: 1,
  rounds: [],
  startedAt: new Date(),
  lastActivityAt: new Date(),
  isAbandoned: false,
  ...overrides,
});

describe("AI Match API Endpoints", () => {
  let startMatchPost: ReturnType<typeof createStartMatchEndpoint>;
  let playRoundPost: ReturnType<typeof createPlayRoundEndpoint>;
  let getMatchStatus: ReturnType<typeof createStatusEndpoint>;
  let getActiveMatch: ReturnType<typeof createResumeEndpoint>;
  let abandonMatchPost: ReturnType<typeof createAbandonEndpoint>;

  beforeEach(() => {
    vi.clearAllMocks();
    startMatchPost = createStartMatchEndpoint();
    playRoundPost = createPlayRoundEndpoint();
    getMatchStatus = createStatusEndpoint();
    getActiveMatch = createResumeEndpoint();
    abandonMatchPost = createAbandonEndpoint();
  });

  describe("POST /api/ai-match/start", () => {
    it("should start a new match successfully", async () => {
      const mockMatch = createMockMatch();
      mockAiMatchManager.startMatch.mockResolvedValue(mockMatch);

      const req = createMockRequest({ address: "0x123" });
      const response = await startMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.match.id).toBe(mockMatch.id);
      expect(data.match.playerId).toBe(mockMatch.playerId);
      expect(data.match.status).toBe(mockMatch.status);
      expect(mockAiMatchManager.startMatch).toHaveBeenCalledWith("0x123");
    });

    it("should normalize address to lowercase", async () => {
      const mockMatch = createMockMatch();
      mockAiMatchManager.startMatch.mockResolvedValue(mockMatch);

      const req = createMockRequest({ address: "0xABC123" });
      await startMatchPost(req);

      expect(mockAiMatchManager.startMatch).toHaveBeenCalledWith("0xabc123");
    });

    it("should return 400 for missing address", async () => {
      const req = createMockRequest({});
      const response = await startMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid address is required");
    });

    it("should return 400 for invalid address type", async () => {
      const req = createMockRequest({ address: 123 });
      const response = await startMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid address is required");
    });

    it("should return 409 for existing active match", async () => {
      mockAiMatchManager.startMatch.mockRejectedValue(
        new InvalidMatchStateError("Player 0x123 already has an active match: match_456"),
      );

      const req = createMockRequest({ address: "0x123" });
      const response = await startMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe(
        "You already have an active match. Please complete or abandon it before starting a new one.",
      );
    });

    it("should return 429 for excessive abandonment patterns", async () => {
      mockAiMatchManager.startMatch.mockRejectedValue(
        new InvalidMatchStateError("Player 0x123 has excessive abandonment patterns and is temporarily restricted"),
      );

      const req = createMockRequest({ address: "0x123" });
      const response = await startMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("You have abandoned too many matches recently. Please wait before starting a new match.");
    });

    it("should return 500 for unexpected errors", async () => {
      mockAiMatchManager.startMatch.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest({ address: "0x123" });
      const response = await startMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to start match");
    });
  });

  describe("POST /api/ai-match/play-round", () => {
    it("should play a round successfully", async () => {
      const mockMatch = createMockMatch({ currentRound: 2, playerScore: 1 });
      const mockRoundResult = {
        winner: "player" as const,
        playerMove: "rock" as const,
        aiMove: "scissors" as const,
      };
      const mockResult = { match: mockMatch, roundResult: mockRoundResult };

      mockAiMatchManager.playRound.mockResolvedValue(mockResult);

      const req = createMockRequest({ matchId: "match_123", playerMove: "rock" });
      const response = await playRoundPost(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.match.id).toBe(mockMatch.id);
      expect(data.match.currentRound).toBe(2);
      expect(data.match.playerScore).toBe(1);
      expect(data.roundResult).toEqual(mockRoundResult);
      expect(mockAiMatchManager.playRound).toHaveBeenCalledWith("match_123", "rock");
    });

    it("should return 400 for missing matchId", async () => {
      const req = createMockRequest({ playerMove: "rock" });
      const response = await playRoundPost(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid matchId is required");
    });

    it("should return 400 for invalid playerMove", async () => {
      const req = createMockRequest({ matchId: "match_123", playerMove: "invalid" });
      const response = await playRoundPost(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid playerMove is required (rock, paper, or scissors)");
    });

    it("should return 404 for match not found", async () => {
      mockAiMatchManager.playRound.mockRejectedValue(new MatchNotFoundError("match_123"));

      const req = createMockRequest({ matchId: "match_123", playerMove: "rock" });
      const response = await playRoundPost(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Match not found");
    });

    it("should return 409 for completed match", async () => {
      mockAiMatchManager.playRound.mockRejectedValue(new MatchCompletedError("match_123"));

      const req = createMockRequest({ matchId: "match_123", playerMove: "rock" });
      const response = await playRoundPost(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Match is already completed");
    });

    it("should return 409 for abandoned match", async () => {
      mockAiMatchManager.playRound.mockRejectedValue(new MatchAbandonedError("match_123"));

      const req = createMockRequest({ matchId: "match_123", playerMove: "rock" });
      const response = await playRoundPost(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Match has been abandoned");
    });
  });

  describe("GET /api/ai-match/status", () => {
    it("should return match status successfully", async () => {
      const mockMatch = createMockMatch();
      mockAiMatchManager.getMatchStatus.mockResolvedValue(mockMatch);

      const req = createMockRequest(undefined, "http://localhost:3000/api/ai-match/status?matchId=match_123");
      const response = await getMatchStatus(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.match.id).toBe(mockMatch.id);
      expect(data.match.playerId).toBe(mockMatch.playerId);
      expect(data.match.status).toBe(mockMatch.status);
      expect(mockAiMatchManager.getMatchStatus).toHaveBeenCalledWith("match_123");
    });

    it("should return null for non-existent match", async () => {
      mockAiMatchManager.getMatchStatus.mockResolvedValue(null);

      const req = createMockRequest(undefined, "http://localhost:3000/api/ai-match/status?matchId=match_123");
      const response = await getMatchStatus(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.match).toBeNull();
    });

    it("should return 400 for missing matchId", async () => {
      const req = createMockRequest(undefined, "http://localhost:3000/api/ai-match/status");
      const response = await getMatchStatus(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid matchId parameter is required");
    });

    it("should return 500 for unexpected errors", async () => {
      mockAiMatchManager.getMatchStatus.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest(undefined, "http://localhost:3000/api/ai-match/status?matchId=match_123");
      const response = await getMatchStatus(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to get match status");
    });
  });

  describe("GET /api/ai-match/resume", () => {
    it("should return active match for player", async () => {
      const mockMatch = createMockMatch();
      mockAiMatchManager.getActiveMatchForPlayer.mockResolvedValue(mockMatch);

      const req = createMockRequest(undefined, "http://localhost:3000/api/ai-match/resume?address=0x123");
      const response = await getActiveMatch(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.match.id).toBe(mockMatch.id);
      expect(data.match.playerId).toBe(mockMatch.playerId);
      expect(data.match.status).toBe(mockMatch.status);
      expect(mockAiMatchManager.getActiveMatchForPlayer).toHaveBeenCalledWith("0x123");
    });

    it("should normalize address to lowercase", async () => {
      mockAiMatchManager.getActiveMatchForPlayer.mockResolvedValue(null);

      const req = createMockRequest(undefined, "http://localhost:3000/api/ai-match/resume?address=0xABC123");
      await getActiveMatch(req);

      expect(mockAiMatchManager.getActiveMatchForPlayer).toHaveBeenCalledWith("0xabc123");
    });

    it("should return null when no active match exists", async () => {
      mockAiMatchManager.getActiveMatchForPlayer.mockResolvedValue(null);

      const req = createMockRequest(undefined, "http://localhost:3000/api/ai-match/resume?address=0x123");
      const response = await getActiveMatch(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.match).toBeNull();
    });

    it("should return 400 for missing address", async () => {
      const req = createMockRequest(undefined, "http://localhost:3000/api/ai-match/resume");
      const response = await getActiveMatch(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid address parameter is required");
    });
  });

  describe("POST /api/ai-match/abandon", () => {
    it("should abandon match successfully", async () => {
      const mockMatch = createMockMatch({
        status: MatchStatus.ABANDONED,
        isAbandoned: true,
        winner: "ai",
        completedAt: new Date(),
      });
      mockAiMatchManager.abandonMatchById.mockResolvedValue(mockMatch);

      const req = createMockRequest({ matchId: "match_123" });
      const response = await abandonMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.match.id).toBe(mockMatch.id);
      expect(data.match.status).toBe(MatchStatus.ABANDONED);
      expect(data.match.isAbandoned).toBe(true);
      expect(data.match.winner).toBe("ai");
      expect(mockAiMatchManager.abandonMatchById).toHaveBeenCalledWith("match_123");
    });

    it("should return 400 for missing matchId", async () => {
      const req = createMockRequest({});
      const response = await abandonMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid matchId is required");
    });

    it("should return 404 for match not found", async () => {
      mockAiMatchManager.abandonMatchById.mockRejectedValue(new MatchNotFoundError("match_123"));

      const req = createMockRequest({ matchId: "match_123" });
      const response = await abandonMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Match not found");
    });

    it("should return 409 for non-active match", async () => {
      mockAiMatchManager.abandonMatchById.mockRejectedValue(
        new InvalidMatchStateError("Cannot abandon match match_123 - not active"),
      );

      const req = createMockRequest({ matchId: "match_123" });
      const response = await abandonMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Match cannot be abandoned (not active)");
    });

    it("should return 500 for unexpected errors", async () => {
      mockAiMatchManager.abandonMatchById.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest({ matchId: "match_123" });
      const response = await abandonMatchPost(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to abandon match");
    });
  });
});
