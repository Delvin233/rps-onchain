/**
 * AI Match Validation Schemas
 *
 * This file contains Zod validation schemas for AI match data structures
 * to ensure type safety and data integrity across the application.
 */
import { MatchStatus } from "./aiMatch";
import { z } from "zod";

// Basic validation schemas
export const MoveSchema = z.enum(["rock", "paper", "scissors"]);

export const RoundWinnerSchema = z.enum(["player", "ai", "tie"]);

export const MatchWinnerSchema = z.enum(["player", "ai", "tie"]);

export const MatchStatusSchema = z.nativeEnum(MatchStatus);

// Ethereum address validation
export const EthereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

// UUID validation for match IDs
export const MatchIdSchema = z.string().uuid("Invalid match ID format");

// Round validation schema
export const RoundResultSchema = z.object({
  winner: RoundWinnerSchema,
  playerMove: MoveSchema,
  aiMove: MoveSchema,
});

export const RoundSchema = z.object({
  roundNumber: z.number().int().min(1).max(3),
  playerMove: MoveSchema,
  aiMove: MoveSchema,
  result: RoundResultSchema,
  timestamp: z.date(),
});

// Core AI Match validation schema
export const AIMatchSchema = z
  .object({
    id: MatchIdSchema,
    playerId: EthereumAddressSchema,
    status: MatchStatusSchema,
    rounds: z.array(RoundSchema).max(3),
    playerScore: z.number().int().min(0).max(2),
    aiScore: z.number().int().min(0).max(2),
    currentRound: z.number().int().min(1).max(3),
    startedAt: z.date(),
    lastActivityAt: z.date(),
    completedAt: z.date().optional(),
    winner: MatchWinnerSchema.optional(),
    isAbandoned: z.boolean(),
  })
  .refine(
    data => {
      // Validate that scores match the number of completed rounds
      const completedRounds = data.rounds.length;
      const totalScore = data.playerScore + data.aiScore;

      // For ties, we might have more rounds than total score
      return totalScore <= completedRounds && completedRounds <= 3;
    },
    {
      message: "Scores must be consistent with completed rounds",
    },
  )
  .refine(
    data => {
      // Validate match completion logic
      if (data.status === MatchStatus.COMPLETED) {
        // Match is completed if either player has 2 wins OR all 3 rounds are played
        return data.playerScore >= 2 || data.aiScore >= 2 || data.rounds.length >= 3;
      }
      return true;
    },
    {
      message: "Completed matches must have a winner with 2+ wins or have played all 3 rounds",
    },
  )
  .refine(
    data => {
      // Validate abandonment logic
      if (data.isAbandoned) {
        return data.status === MatchStatus.ABANDONED;
      }
      return true;
    },
    {
      message: "Abandoned matches must have ABANDONED status",
    },
  );

// API request validation schemas
export const CreateMatchParamsSchema = z.object({
  playerId: EthereumAddressSchema,
});

export const PlayRoundParamsSchema = z.object({
  matchId: MatchIdSchema,
  playerMove: MoveSchema,
});

export const GetMatchStatusParamsSchema = z.object({
  matchId: MatchIdSchema,
});

export const ResumeMatchParamsSchema = z.object({
  playerId: EthereumAddressSchema,
});

export const AbandonMatchParamsSchema = z.object({
  matchId: MatchIdSchema,
});

// API response validation schemas
export const StartMatchResponseSchema = z.object({
  match: AIMatchSchema,
  success: z.boolean(),
});

export const PlayRoundResponseSchema = z.object({
  match: AIMatchSchema,
  roundResult: RoundResultSchema,
  matchCompleted: z.boolean(),
  success: z.boolean(),
});

export const GetMatchStatusResponseSchema = z.object({
  match: AIMatchSchema.nullable(),
  success: z.boolean(),
});

export const ResumeMatchResponseSchema = z.object({
  match: AIMatchSchema.nullable(),
  canResume: z.boolean(),
  success: z.boolean(),
});

export const AbandonMatchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Database row validation schemas
export const AIMatchRowSchema = z.object({
  id: z.string(),
  player_id: EthereumAddressSchema,
  status: z.string(),
  player_score: z.number().int().min(0).max(2),
  ai_score: z.number().int().min(0).max(2),
  current_round: z.number().int().min(1).max(3),
  rounds_data: z.string(), // JSON string
  started_at: z.string(), // ISO datetime
  last_activity_at: z.string(), // ISO datetime
  completed_at: z.string().optional(), // ISO datetime
  winner: z.string().optional(),
  is_abandoned: z.boolean(),
  created_at: z.string(), // ISO datetime
});

export const AIMatchStatsSchema = z.object({
  address: EthereumAddressSchema,
  ai_matches_played: z.number().int().min(0),
  ai_matches_won: z.number().int().min(0),
  ai_matches_lost: z.number().int().min(0),
  ai_matches_tied: z.number().int().min(0),
  ai_matches_abandoned: z.number().int().min(0),
  updated_at: z.date(),
});

// Redis cache validation schema
export const AIMatchCacheSchema = z.object({
  matchId: MatchIdSchema,
  status: MatchStatusSchema,
  playerScore: z.number().int().min(0).max(2),
  aiScore: z.number().int().min(0).max(2),
  currentRound: z.number().int().min(1).max(3),
  rounds: z.array(RoundSchema).max(3),
  lastActivityAt: z.number(), // Unix timestamp
});

// Utility validation functions
export const validateMove = (move: unknown): move is string => {
  return MoveSchema.safeParse(move).success;
};

export const validateEthereumAddress = (address: unknown): address is string => {
  return EthereumAddressSchema.safeParse(address).success;
};

export const validateMatchId = (id: unknown): id is string => {
  return MatchIdSchema.safeParse(id).success;
};

export const validateMatchStatus = (status: unknown): status is MatchStatus => {
  return MatchStatusSchema.safeParse(status).success;
};

// Validation helper functions for API endpoints
export const validateCreateMatchRequest = (data: unknown) => {
  return CreateMatchParamsSchema.safeParse(data);
};

export const validatePlayRoundRequest = (data: unknown) => {
  return PlayRoundParamsSchema.safeParse(data);
};

export const validateGetMatchStatusRequest = (data: unknown) => {
  return GetMatchStatusParamsSchema.safeParse(data);
};

export const validateResumeMatchRequest = (data: unknown) => {
  return ResumeMatchParamsSchema.safeParse(data);
};

export const validateAbandonMatchRequest = (data: unknown) => {
  return AbandonMatchParamsSchema.safeParse(data);
};

// Validation for database operations
export const validateAIMatchRow = (data: unknown) => {
  return AIMatchRowSchema.safeParse(data);
};

export const validateAIMatchStats = (data: unknown) => {
  return AIMatchStatsSchema.safeParse(data);
};

export const validateAIMatchCache = (data: unknown) => {
  return AIMatchCacheSchema.safeParse(data);
};

// Type inference from schemas
export type ValidatedCreateMatchParams = z.infer<typeof CreateMatchParamsSchema>;
export type ValidatedPlayRoundParams = z.infer<typeof PlayRoundParamsSchema>;
export type ValidatedGetMatchStatusParams = z.infer<typeof GetMatchStatusParamsSchema>;
export type ValidatedResumeMatchParams = z.infer<typeof ResumeMatchParamsSchema>;
export type ValidatedAbandonMatchParams = z.infer<typeof AbandonMatchParamsSchema>;

export type ValidatedAIMatch = z.infer<typeof AIMatchSchema>;
export type ValidatedAIMatchRow = z.infer<typeof AIMatchRowSchema>;
export type ValidatedAIMatchStats = z.infer<typeof AIMatchStatsSchema>;
export type ValidatedAIMatchCache = z.infer<typeof AIMatchCacheSchema>;

export type ValidatedStartMatchResponse = z.infer<typeof StartMatchResponseSchema>;
export type ValidatedPlayRoundResponse = z.infer<typeof PlayRoundResponseSchema>;
export type ValidatedGetMatchStatusResponse = z.infer<typeof GetMatchStatusResponseSchema>;
export type ValidatedResumeMatchResponse = z.infer<typeof ResumeMatchResponseSchema>;
export type ValidatedAbandonMatchResponse = z.infer<typeof AbandonMatchResponseSchema>;
