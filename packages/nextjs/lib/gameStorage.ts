// Shared in-memory game storage
// Note: In serverless, this resets on each cold start
// Games are stored temporarily until payout completes

export const games = new Map<string, { creatorMove?: string; joinerMove?: string; creator: string; joiner: string }>();

export function determineWinner(move1: string, move2: string): "creator" | "joiner" | "tie" {
  if (move1 === move2) return "tie";
  if (
    (move1 === "rock" && move2 === "scissors") ||
    (move1 === "paper" && move2 === "rock") ||
    (move1 === "scissors" && move2 === "paper")
  ) {
    return "creator";
  }
  return "joiner";
}
