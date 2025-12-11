/**
 * AI Match Utility Functions
 *
 * This file contains utility functions for AI match operations including
 * serialization, deserialization, validation, and match state management.
 */
// Using crypto.randomUUID() instead of uuid package
import {
  AIMatch,
  AIMatchCache,
  MATCH_TIMEOUT_MINUTES,
  MAX_ROUNDS,
  MatchStatus,
  MatchWinner,
  Move,
  ROUNDS_TO_WIN,
  Round,
  RoundResult,
  createEmptyMatch,
} from "../types/aiMatch";
import { AIMatchSchema, validateEthereumAddress, validateMove } from "../types/aiMatchValidation";
import { determineWinner } from "./gameUtils";

/**
 * Generate a unique match ID
 */
export const generateMatchId = (): string => {
  // Use crypto.randomUUID() for UUID v4 generation
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generate AI move (random selection)
 */
export const generateAIMove = (): Move => {
  const moves: Move[] = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * moves.length)];
};

/**
 * Create a new AI match
 */
export const createNewMatch = (playerId: string): AIMatch => {
  if (!validateEthereumAddress(playerId)) {
    throw new Error("Invalid player ID format");
  }

  const matchId = generateMatchId();
  const baseMatch = createEmptyMatch(playerId);

  return {
    id: matchId,
    ...baseMatch,
  };
};

/**
 * Play a round in an AI match
 */
export const playRound = (match: AIMatch, playerMove: Move): { match: AIMatch; roundResult: RoundResult } => {
  // Validate input
  if (!validateMove(playerMove)) {
    throw new Error("Invalid player move");
  }

  if (match.status !== MatchStatus.ACTIVE) {
    throw new Error("Match is not active");
  }

  if (match.rounds.length >= MAX_ROUNDS) {
    throw new Error("Match has already completed maximum rounds");
  }

  if (match.playerScore >= ROUNDS_TO_WIN || match.aiScore >= ROUNDS_TO_WIN) {
    throw new Error("Match is already completed");
  }

  // Generate AI move and determine round result
  const aiMove = generateAIMove();
  const roundWinner = determineWinner(playerMove, aiMove);

  const roundResult: RoundResult = {
    winner: roundWinner === "win" ? "player" : roundWinner === "lose" ? "ai" : "tie",
    playerMove,
    aiMove,
  };

  // Create new round
  const newRound: Round = {
    roundNumber: match.rounds.length + 1,
    playerMove,
    aiMove,
    result: roundResult,
    timestamp: new Date(),
  };

  // Update match state
  const updatedMatch: AIMatch = {
    ...match,
    rounds: [...match.rounds, newRound],
    playerScore: match.playerScore + (roundResult.winner === "player" ? 1 : 0),
    aiScore: match.aiScore + (roundResult.winner === "ai" ? 1 : 0),
    currentRound: Math.min(match.currentRound + 1, MAX_ROUNDS),
    lastActivityAt: new Date(),
  };

  // Check if match is completed
  const matchCompleted = checkMatchCompletion(updatedMatch);
  if (matchCompleted.isCompleted) {
    updatedMatch.status = MatchStatus.COMPLETED;
    updatedMatch.completedAt = new Date();
    updatedMatch.winner = matchCompleted.winner;
  }

  return { match: updatedMatch, roundResult };
};

/**
 * Check if a match is completed and determine winner
 */
export const checkMatchCompletion = (match: AIMatch): { isCompleted: boolean; winner?: MatchWinner } => {
  // Check if either player has won 2 rounds
  if (match.playerScore >= ROUNDS_TO_WIN) {
    return { isCompleted: true, winner: "player" };
  }

  if (match.aiScore >= ROUNDS_TO_WIN) {
    return { isCompleted: true, winner: "ai" };
  }

  // Check if all 3 rounds are completed (tie scenario)
  if (match.rounds.length >= MAX_ROUNDS) {
    if (match.playerScore === match.aiScore) {
      return { isCompleted: true, winner: "tie" };
    }
    // This shouldn't happen if logic is correct, but handle gracefully
    return {
      isCompleted: true,
      winner: match.playerScore > match.aiScore ? "player" : "ai",
    };
  }

  return { isCompleted: false };
};

/**
 * Check if a match should be abandoned due to timeout
 */
export const shouldAbandonMatch = (match: AIMatch): boolean => {
  if (match.status !== MatchStatus.ACTIVE) {
    return false;
  }

  const timeoutMs = MATCH_TIMEOUT_MINUTES * 60 * 1000;
  const timeSinceLastActivity = Date.now() - match.lastActivityAt.getTime();

  return timeSinceLastActivity > timeoutMs;
};

/**
 * Abandon a match due to timeout or player action
 */
export const abandonMatch = (match: AIMatch): AIMatch => {
  return {
    ...match,
    status: MatchStatus.ABANDONED,
    isAbandoned: true,
    completedAt: new Date(),
    winner: "ai", // AI wins by default when player abandons
    lastActivityAt: new Date(),
  };
};

/**
 * Calculate match duration in minutes
 */
export const calculateMatchDuration = (match: AIMatch): number => {
  const endTime = match.completedAt || new Date();
  const durationMs = endTime.getTime() - match.startedAt.getTime();
  return Math.round(durationMs / (1000 * 60)); // Convert to minutes
};

/**
 * Get match progress summary
 */
export const getMatchProgress = (
  match: AIMatch,
): {
  roundsCompleted: number;
  roundsRemaining: number;
  playerScore: number;
  aiScore: number;
  isCompleted: boolean;
  winner?: MatchWinner;
} => {
  const completion = checkMatchCompletion(match);

  return {
    roundsCompleted: match.rounds.length,
    roundsRemaining: MAX_ROUNDS - match.rounds.length,
    playerScore: match.playerScore,
    aiScore: match.aiScore,
    isCompleted: completion.isCompleted,
    winner: completion.winner,
  };
};

/**
 * Convert match to cache format for Redis
 */
export const convertMatchToCache = (match: AIMatch): AIMatchCache => {
  return {
    matchId: match.id,
    status: match.status,
    playerScore: match.playerScore,
    aiScore: match.aiScore,
    currentRound: match.currentRound,
    rounds: match.rounds,
    lastActivityAt: match.lastActivityAt.getTime(),
  };
};

/**
 * Convert cache format back to full match (requires additional data from database)
 */
export const convertCacheToMatch = (
  cache: AIMatchCache,
  playerId: string,
  startedAt: Date,
  completedAt?: Date,
  winner?: MatchWinner,
  isAbandoned: boolean = false,
): AIMatch => {
  return {
    id: cache.matchId,
    playerId,
    status: cache.status,
    rounds: cache.rounds,
    playerScore: cache.playerScore,
    aiScore: cache.aiScore,
    currentRound: cache.currentRound,
    startedAt,
    lastActivityAt: new Date(cache.lastActivityAt),
    completedAt,
    winner,
    isAbandoned,
  };
};

/**
 * Validate match data integrity
 */
export const validateMatchIntegrity = (match: AIMatch): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    // Use Zod schema validation
    const result = AIMatchSchema.safeParse(match);
    if (!result.success) {
      errors.push(...result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`));
    }
  } catch (error) {
    errors.push(`Schema validation failed: ${error}`);
  }

  // Additional business logic validation
  if (match.rounds.length > MAX_ROUNDS) {
    errors.push(`Too many rounds: ${match.rounds.length} > ${MAX_ROUNDS}`);
  }

  if (match.playerScore > ROUNDS_TO_WIN || match.aiScore > ROUNDS_TO_WIN) {
    errors.push(`Invalid scores: player=${match.playerScore}, ai=${match.aiScore}`);
  }

  // Validate round sequence
  for (let i = 0; i < match.rounds.length; i++) {
    const round = match.rounds[i];
    if (round.roundNumber !== i + 1) {
      errors.push(`Round ${i} has incorrect round number: ${round.roundNumber}`);
    }
  }

  // Validate scores match round results
  const calculatedPlayerScore = match.rounds.filter(r => r.result.winner === "player").length;
  const calculatedAiScore = match.rounds.filter(r => r.result.winner === "ai").length;

  if (calculatedPlayerScore !== match.playerScore) {
    errors.push(`Player score mismatch: calculated=${calculatedPlayerScore}, stored=${match.playerScore}`);
  }

  if (calculatedAiScore !== match.aiScore) {
    errors.push(`AI score mismatch: calculated=${calculatedAiScore}, stored=${match.aiScore}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get time remaining before match abandonment (in minutes)
 */
export const getTimeRemainingBeforeAbandonment = (match: AIMatch): number => {
  if (match.status !== MatchStatus.ACTIVE) {
    return 0;
  }

  const timeoutMs = MATCH_TIMEOUT_MINUTES * 60 * 1000;
  const timeSinceLastActivity = Date.now() - match.lastActivityAt.getTime();
  const timeRemainingMs = timeoutMs - timeSinceLastActivity;

  return Math.max(0, Math.ceil(timeRemainingMs / (1000 * 60)));
};

/**
 * Format match for display purposes
 */
export const formatMatchForDisplay = (
  match: AIMatch,
): {
  id: string;
  status: string;
  score: string;
  duration: string;
  roundsPlayed: number;
  winner?: string;
} => {
  const duration = calculateMatchDuration(match);
  const durationText = duration < 1 ? "< 1 min" : `${duration} min`;

  return {
    id: match.id,
    status: match.status,
    score: `${match.playerScore}-${match.aiScore}`,
    duration: durationText,
    roundsPlayed: match.rounds.length,
    winner: match.winner,
  };
};

/**
 * Create match summary for history display
 */
export const createMatchSummary = (
  match: AIMatch,
): {
  matchId: string;
  finalScore: { player: number; ai: number };
  winner: MatchWinner | undefined;
  duration: number;
  completedAt: Date | undefined;
  roundDetails: Array<{
    round: number;
    playerMove: Move;
    aiMove: Move;
    winner: string;
  }>;
} => {
  return {
    matchId: match.id,
    finalScore: {
      player: match.playerScore,
      ai: match.aiScore,
    },
    winner: match.winner,
    duration: calculateMatchDuration(match),
    completedAt: match.completedAt,
    roundDetails: match.rounds.map(round => ({
      round: round.roundNumber,
      playerMove: round.playerMove,
      aiMove: round.aiMove,
      winner: round.result.winner,
    })),
  };
};
