/**
 * AI Leaderboard Rank System
 *
 * This module defines the rank progression system for AI matches.
 * Players earn ranks based on their total AI wins, with 38 ranks total.
 *
 * Rank Tiers:
 * - Entry (0-19 wins): Beginner, Novice, Fighter
 * - Warrior (20-49 wins): Warrior I-III
 * - Expert (50-79 wins): Expert I-III
 * - Master (80-109 wins): Master I-III
 * - Grandmaster (110-139 wins): Grandmaster I-III
 * - Champion (140-169 wins): Champion I-III
 * - Legend (170-219 wins): Legend I-V
 * - Mythic (220-319 wins): Mythic I-V
 * - RPS-God (320-690+ wins): RPS-God I-X
 */

export interface RankTier {
  name: string;
  minWins: number;
  maxWins: number | null;
  color: string;
  gradient?: string;
}

export const RANK_TIERS: RankTier[] = [
  // Entry Ranks (0-19 wins)
  { name: "Beginner", minWins: 0, maxWins: 4, color: "#9CA3AF" },
  { name: "Novice", minWins: 5, maxWins: 9, color: "#D1D5DB" },
  { name: "Fighter", minWins: 10, maxWins: 19, color: "#60A5FA" },

  // Warrior Ranks (20-49 wins)
  { name: "Warrior I", minWins: 20, maxWins: 29, color: "#3B82F6" },
  { name: "Warrior II", minWins: 30, maxWins: 39, color: "#3B82F6" },
  { name: "Warrior III", minWins: 40, maxWins: 49, color: "#3B82F6" },

  // Expert Ranks (50-79 wins)
  { name: "Expert I", minWins: 50, maxWins: 59, color: "#10B981" },
  { name: "Expert II", minWins: 60, maxWins: 69, color: "#10B981" },
  { name: "Expert III", minWins: 70, maxWins: 79, color: "#10B981" },

  // Master Ranks (80-109 wins)
  { name: "Master I", minWins: 80, maxWins: 89, color: "#059669" },
  { name: "Master II", minWins: 90, maxWins: 99, color: "#059669" },
  { name: "Master III", minWins: 100, maxWins: 109, color: "#059669" },

  // Grandmaster Ranks (110-139 wins)
  { name: "Grandmaster I", minWins: 110, maxWins: 119, color: "#A855F7" },
  { name: "Grandmaster II", minWins: 120, maxWins: 129, color: "#A855F7" },
  { name: "Grandmaster III", minWins: 130, maxWins: 139, color: "#A855F7" },

  // Champion Ranks (140-169 wins)
  { name: "Champion I", minWins: 140, maxWins: 149, color: "#F59E0B" },
  { name: "Champion II", minWins: 150, maxWins: 159, color: "#F59E0B" },
  { name: "Champion III", minWins: 160, maxWins: 169, color: "#F59E0B" },

  // Legend Ranks (170-219 wins)
  { name: "Legend I", minWins: 170, maxWins: 179, color: "#EF4444" },
  { name: "Legend II", minWins: 180, maxWins: 189, color: "#EF4444" },
  { name: "Legend III", minWins: 190, maxWins: 199, color: "#EF4444" },
  { name: "Legend IV", minWins: 200, maxWins: 209, color: "#EF4444" },
  { name: "Legend V", minWins: 210, maxWins: 219, color: "#EF4444" },

  // Mythic Ranks (220-319 wins) - Rainbow gradient
  {
    name: "Mythic I",
    minWins: 220,
    maxWins: 239,
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)",
  },
  {
    name: "Mythic II",
    minWins: 240,
    maxWins: 259,
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)",
  },
  {
    name: "Mythic III",
    minWins: 260,
    maxWins: 279,
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)",
  },
  {
    name: "Mythic IV",
    minWins: 280,
    maxWins: 299,
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)",
  },
  {
    name: "Mythic V",
    minWins: 300,
    maxWins: 319,
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #EC4899, #8B5CF6)",
  },

  // RPS-God Ranks (320-690+ wins) - Cosmic gradient
  {
    name: "RPS-God I",
    minWins: 320,
    maxWins: 369,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God II",
    minWins: 370,
    maxWins: 419,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God III",
    minWins: 420,
    maxWins: 469,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God IV",
    minWins: 470,
    maxWins: 519,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God V",
    minWins: 520,
    maxWins: 569,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God VI",
    minWins: 570,
    maxWins: 599,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God VII",
    minWins: 600,
    maxWins: 629,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God VIII",
    minWins: 630,
    maxWins: 659,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God IX",
    minWins: 660,
    maxWins: 689,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF)",
  },
  {
    name: "RPS-God X",
    minWins: 690,
    maxWins: null,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FFA500, #FF4500, #8B00FF, #00FFFF)",
  },
];

/**
 * Get the rank tier for a given number of wins
 * @param wins - Total AI wins
 * @returns The corresponding RankTier
 */
export function getRankForWins(wins: number): RankTier {
  // Iterate from highest to lowest to find the appropriate rank
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (wins >= RANK_TIERS[i].minWins) {
      return RANK_TIERS[i];
    }
  }
  // Default to Beginner if somehow no match (shouldn't happen)
  return RANK_TIERS[0];
}

/**
 * Get the next rank and wins needed to reach it
 * @param currentWins - Current total AI wins
 * @returns Object with next rank and wins needed, or null if at max rank
 */
export function getNextRank(currentWins: number): { rank: RankTier; winsNeeded: number } | null {
  const currentRank = getRankForWins(currentWins);
  const currentIndex = RANK_TIERS.findIndex(r => r.name === currentRank.name);

  // Check if already at max rank
  if (currentIndex === RANK_TIERS.length - 1) {
    return null;
  }

  const nextRank = RANK_TIERS[currentIndex + 1];
  const winsNeeded = nextRank.minWins - currentWins;

  return { rank: nextRank, winsNeeded };
}

/**
 * Get the color for a rank (supports gradients)
 * @param rankName - Name of the rank
 * @returns Color string (hex or gradient)
 */
export function getRankColor(rankName: string): string {
  const rank = RANK_TIERS.find(r => r.name === rankName);
  return rank?.gradient || rank?.color || "#9CA3AF";
}

/**
 * Check if a rank has a gradient
 * @param rankName - Name of the rank
 * @returns True if rank has gradient styling
 */
export function hasGradient(rankName: string): boolean {
  const rank = RANK_TIERS.find(r => r.name === rankName);
  return !!rank?.gradient;
}

/**
 * Get rank tier category (for grouping/filtering)
 * @param rankName - Name of the rank
 * @returns Tier category name
 */
export function getRankTier(rankName: string): string {
  if (rankName === "Beginner" || rankName === "Novice" || rankName === "Fighter") return "Entry";
  if (rankName.startsWith("Warrior")) return "Warrior";
  if (rankName.startsWith("Expert")) return "Expert";
  if (rankName.startsWith("Master")) return "Master";
  if (rankName.startsWith("Grandmaster")) return "Grandmaster";
  if (rankName.startsWith("Champion")) return "Champion";
  if (rankName.startsWith("Legend")) return "Legend";
  if (rankName.startsWith("Mythic")) return "Mythic";
  if (rankName.startsWith("RPS-God")) return "RPS-God";
  return "Unknown";
}
