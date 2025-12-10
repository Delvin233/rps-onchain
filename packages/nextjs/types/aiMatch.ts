/**
 * AI Match Data Models and Interfaces
 *
 * This file defines the TypeScript interfaces and types for the best-of-three
 * AI match system, including match state, rounds, and related data structures.
 */

// Basic game types (reused from existing system)
export type Move = "rock" | "paper" | "scissors";

export type RoundWinner = "player" | "ai" | "tie";

export type MatchWinner = "player" | "ai" | "tie";

// Match status enumeration
export enum MatchStatus {
  ACTIVE = "active", // Match in progress
  COMPLETED = "completed", // Match finished normally
  ABANDONED = "abandoned", // Match abandoned by player
}

// Round result interface
export interface RoundResult {
  winner: RoundWinner;
  playerMove: Move;
  aiMove: Move;
}

// Individual round within a match
export interface Round {
  roundNumber: number; // Round sequence (1, 2, or 3)
  playerMove: Move; // Player's move
  aiMove: Move; // AI's move
  result: RoundResult; // Round outcome
  timestamp: Date; // Round completion time
}

// Core AI Match interface
export interface AIMatch {
  id: string; // Unique match identifier
  playerId: string; // Player's wallet address
  status: MatchStatus; // Current match state
  rounds: Round[]; // Array of completed rounds
  playerScore: number; // Player's round wins (0-2)
  aiScore: number; // AI's round wins (0-2)
  currentRound: number; // Current round number (1-3)
  startedAt: Date; // Match start timestamp
  lastActivityAt: Date; // Last round completion time
  completedAt?: Date; // Match completion timestamp
  winner?: MatchWinner; // Final match result
  isAbandoned: boolean; // Abandonment flag
}

// Match creation parameters
export interface CreateMatchParams {
  playerId: string;
}

// Round play parameters
export interface PlayRoundParams {
  matchId: string;
  playerMove: Move;
}

// Match resumption data
export interface ResumeMatchData {
  match: AIMatch;
  canResume: boolean;
  timeRemaining?: number; // Minutes remaining before auto-abandonment
}

// Match statistics for database storage
export interface AIMatchStats {
  address: string;
  ai_matches_played: number;
  ai_matches_won: number;
  ai_matches_lost: number;
  ai_matches_tied: number;
  ai_matches_abandoned: number;
  updated_at: Date;
}

// Database row interface for ai_matches table
export interface AIMatchRow {
  id: string;
  player_id: string;
  status: string;
  player_score: number;
  ai_score: number;
  current_round: number;
  rounds_data: string; // JSON serialized Round[]
  started_at: string; // ISO datetime string
  last_activity_at: string; // ISO datetime string
  completed_at?: string; // ISO datetime string
  winner?: string;
  is_abandoned: boolean;
  created_at: string; // ISO datetime string
}

// Redis cache interface for active matches
export interface AIMatchCache {
  matchId: string;
  status: MatchStatus;
  playerScore: number;
  aiScore: number;
  currentRound: number;
  rounds: Round[];
  lastActivityAt: number; // Unix timestamp
}

// API response interfaces
export interface StartMatchResponse {
  match: AIMatch;
  success: boolean;
}

export interface PlayRoundResponse {
  match: AIMatch;
  roundResult: RoundResult;
  matchCompleted: boolean;
  success: boolean;
}

export interface GetMatchStatusResponse {
  match: AIMatch | null;
  success: boolean;
}

export interface ResumeMatchResponse {
  match: AIMatch | null;
  canResume: boolean;
  success: boolean;
}

export interface AbandonMatchResponse {
  success: boolean;
  message: string;
}

// Error types for AI match operations
export class AIMatchError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AIMatchError";
  }
}

export class MatchNotFoundError extends AIMatchError {
  constructor(matchId: string) {
    super(`Match not found: ${matchId}`, "MATCH_NOT_FOUND", 404);
  }
}

export class InvalidMatchStateError extends AIMatchError {
  constructor(message: string) {
    super(message, "INVALID_MATCH_STATE", 400);
  }
}

export class MatchCompletedError extends AIMatchError {
  constructor(matchId: string) {
    super(`Match already completed: ${matchId}`, "MATCH_COMPLETED", 400);
  }
}

export class MatchAbandonedError extends AIMatchError {
  constructor(matchId: string) {
    super(`Match was abandoned: ${matchId}`, "MATCH_ABANDONED", 400);
  }
}

// Validation schemas and utilities
export const isValidMove = (move: string): move is Move => {
  return ["rock", "paper", "scissors"].includes(move);
};

export const isValidMatchStatus = (status: string): status is MatchStatus => {
  return Object.values(MatchStatus).includes(status as MatchStatus);
};

export const isValidRoundNumber = (round: number): boolean => {
  return Number.isInteger(round) && round >= 1 && round <= 3;
};

export const isValidScore = (score: number): boolean => {
  return Number.isInteger(score) && score >= 0 && score <= 2;
};

// Utility functions for match data
export const createEmptyMatch = (playerId: string): Omit<AIMatch, "id"> => {
  const now = new Date();
  return {
    playerId,
    status: MatchStatus.ACTIVE,
    rounds: [],
    playerScore: 0,
    aiScore: 0,
    currentRound: 1,
    startedAt: now,
    lastActivityAt: now,
    isAbandoned: false,
  };
};

export const serializeRounds = (rounds: Round[]): string => {
  return JSON.stringify(
    rounds.map(round => ({
      ...round,
      timestamp: round.timestamp.toISOString(),
    })),
  );
};

export const deserializeRounds = (roundsData: string): Round[] => {
  try {
    const parsed = JSON.parse(roundsData);
    return parsed.map((round: any) => ({
      ...round,
      timestamp: new Date(round.timestamp),
    }));
  } catch (error) {
    console.error("Failed to deserialize rounds data:", error);
    return [];
  }
};

export const convertRowToMatch = (row: AIMatchRow): AIMatch => {
  return {
    id: row.id,
    playerId: row.player_id,
    status: row.status as MatchStatus,
    rounds: deserializeRounds(row.rounds_data),
    playerScore: row.player_score,
    aiScore: row.ai_score,
    currentRound: row.current_round,
    startedAt: new Date(row.started_at),
    lastActivityAt: new Date(row.last_activity_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    winner: row.winner as MatchWinner | undefined,
    isAbandoned: row.is_abandoned,
  };
};

export const convertMatchToRow = (match: AIMatch): Omit<AIMatchRow, "created_at"> => {
  return {
    id: match.id,
    player_id: match.playerId,
    status: match.status,
    player_score: match.playerScore,
    ai_score: match.aiScore,
    current_round: match.currentRound,
    rounds_data: serializeRounds(match.rounds),
    started_at: match.startedAt.toISOString(),
    last_activity_at: match.lastActivityAt.toISOString(),
    completed_at: match.completedAt?.toISOString(),
    winner: match.winner,
    is_abandoned: match.isAbandoned,
  };
};

// Constants
export const MAX_ROUNDS = 3;
export const ROUNDS_TO_WIN = 2;
export const MATCH_TIMEOUT_MINUTES = 10;
export const REDIS_MATCH_TTL_SECONDS = 600; // 10 minutes
