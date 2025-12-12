import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { RewardCalculator, TOTAL_WEEKLY_REWARDS, WEEKLY_REWARDS } from "~~/lib/rewardSystem";

export async function GET() {
  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Get current AI leaderboard (top 50 for context)
    const leaderboardResult = await db.execute(`
      SELECT 
        address as player_address,
        COALESCE(ai_matches_won, 0) as ai_wins,
        COALESCE(ai_matches_played, 0) as ai_total_games,
        CASE 
          WHEN COALESCE(ai_matches_played, 0) > 0 THEN ROUND((COALESCE(ai_matches_won, 0) * 100.0) / COALESCE(ai_matches_played, 0), 1)
          ELSE 0 
        END as win_rate,
        ROW_NUMBER() OVER (ORDER BY COALESCE(ai_matches_won, 0) DESC, win_rate DESC) as rank
      FROM stats 
      WHERE COALESCE(ai_matches_played, 0) >= 5  -- Minimum 5 games to qualify
      ORDER BY COALESCE(ai_matches_won, 0) DESC, win_rate DESC
      LIMIT 50
    `);

    const leaderboard = leaderboardResult.rows.map((row: any) => ({
      address: row.player_address,
      wins: row.ai_wins,
      totalGames: row.ai_total_games,
      winRate: row.win_rate,
      rank: row.rank,
      potentialReward: WEEKLY_REWARDS[row.rank] || 0,
      isEligible: row.rank <= 30,
    }));

    // Calculate current season info
    const currentSeasonId = RewardCalculator.getCurrentSeasonId();
    const nextPayoutDate = RewardCalculator.getNextPayoutDate();
    const timeUntilPayout = RewardCalculator.formatTimeUntilPayout();

    // Get season dates
    const { startDate, endDate } = RewardCalculator.getSeasonDates(currentSeasonId);

    // Calculate total rewards for eligible players
    const eligiblePlayers = leaderboard.filter((p: any) => p.isEligible);
    const totalRewardsThisWeek = eligiblePlayers.reduce((sum: number, p: any) => sum + p.potentialReward, 0);

    return NextResponse.json({
      success: true,
      data: {
        season: {
          id: currentSeasonId,
          name: `Week ${currentSeasonId.split("-W")[1]} ${currentSeasonId.split("-W")[0]}`,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: "active",
        },
        payout: {
          nextPayoutDate: nextPayoutDate.toISOString(),
          timeUntilPayout,
          totalRewards: totalRewardsThisWeek,
          maxPossibleRewards: TOTAL_WEEKLY_REWARDS,
        },
        leaderboard: leaderboard.slice(0, 35), // Show top 35 for context
        rewardStructure: WEEKLY_REWARDS,
        eligibilityRequirements: {
          minimumGames: 5,
          topPlayersRewarded: 30,
          resetPeriod: "weekly",
        },
        stats: {
          totalEligiblePlayers: eligiblePlayers.length,
          totalQualifiedPlayers: leaderboard.length,
          averageReward: eligiblePlayers.length > 0 ? totalRewardsThisWeek / eligiblePlayers.length : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching current rewards:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reward information" }, { status: 500 });
  }
}
