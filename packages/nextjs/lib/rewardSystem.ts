// Reward Distribution System
// Phase 1: Backend-based reward distribution for top 23 players

export interface RewardTier {
  rank: number;
  amount: number; // CELO amount
}

export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "active" | "completed";
  totalRewards: number;
}

export interface RewardDistribution {
  id: string;
  seasonId: string;
  playerAddress: string;
  rank: number;
  rewardAmount: number;
  distributedAt?: Date;
  txHash?: string;
  status: "pending" | "distributed" | "failed";
}

// Weekly reward structure for top 23 players
export const MONTHLY_REWARDS: Record<number, number> = {
  1: 40, // 1st place: 40 CELO
  2: 25, // 2nd place: 25 CELO
  3: 18, // 3rd place: 18 CELO
  4: 15, // 4th place: 15 CELO
  5: 12, // 5th place: 12 CELO
  6: 10, // 6th-10th: 10 CELO each
  7: 10,
  8: 10,
  9: 10,
  10: 10,
  11: 8, // 11th-15th: 8 CELO each
  12: 8,
  13: 8,
  14: 8,
  15: 8,
  16: 6, // 16th-20th: 6 CELO each
  17: 6,
  18: 6,
  19: 6,
  20: 6,
  21: 4, // 21st-25th: 4 CELO each
  22: 4,
  23: 4,
  24: 4,
  25: 4,
  26: 3, // 26th-30th: 3 CELO each
  27: 3,
  28: 3,
  29: 3,
  30: 3,
};

export const TOTAL_MONTHLY_REWARDS = Object.values(MONTHLY_REWARDS).reduce((sum, amount) => sum + amount, 0);

export class RewardCalculator {
  static calculateMonthlyRewards(
    leaderboard: Array<{ address: string; wins: number; rank: number }>,
  ): RewardDistribution[] {
    const seasonId = this.getCurrentSeasonId();

    return leaderboard
      .slice(0, 30) // Top 30 players only
      .map((player, index) => ({
        id: `${seasonId}-${player.address}`,
        seasonId,
        playerAddress: player.address,
        rank: index + 1,
        rewardAmount: MONTHLY_REWARDS[index + 1] || 0,
        status: "pending" as const,
      }));
  }

  static getCurrentSeasonId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    return `${year}-M${month.toString().padStart(2, "0")}`;
  }

  static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  static getSeasonDates(seasonId: string): { startDate: Date; endDate: Date } {
    const [year, monthStr] = seasonId.split("-M");
    const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed

    const startDate = new Date(parseInt(year), month, 1);
    const endDate = new Date(parseInt(year), month + 1, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  static getNextPayoutDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0); // First day of next month at midnight
    return nextMonth;
  }

  static formatTimeUntilPayout(): string {
    const nextPayout = this.getNextPayoutDate();
    const now = new Date();
    const diff = nextPayout.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}

// Campaign system for special events
export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  rewardMultiplier: number;
  specialRules?: {
    minGames?: number;
    gameMode?: "ai" | "pvp" | "both";
    bonusConditions?: string[];
  };
  status: "upcoming" | "active" | "completed";
}

export const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: "tournament-2024",
    name: "Celo Tournament Special",
    description: "Double rewards during the official Celo miniapp tournament!",
    startDate: new Date("2024-12-12"),
    endDate: new Date("2024-12-19"),
    rewardMultiplier: 2.0,
    specialRules: {
      minGames: 5,
      gameMode: "both",
      bonusConditions: ["Share on social media", "Invite 3 friends"],
    },
    status: "active",
  },
];
