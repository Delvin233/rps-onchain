import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { MONTHLY_REWARDS, RewardCalculator } from "~~/lib/rewardSystem";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  const adminKey = process.env.ADMIN_KEY;

  return Boolean(adminKey && token === adminKey);
}

export async function GET(request: NextRequest) {
  // Check authentication
  if (!checkAuth(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId") || RewardCalculator.getCurrentSeasonId();

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Get final leaderboard for the season
    const leaderboardResult = await db.execute(`
      SELECT 
        address as player_address,
        COALESCE(ai_matches_won, 0) as ai_wins,
        COALESCE(ai_matches_played, 0) as ai_total_games,
        CASE 
          WHEN COALESCE(ai_matches_played, 0) > 0 THEN ROUND((COALESCE(ai_matches_won, 0) * 100.0) / COALESCE(ai_matches_played, 0), 1)
          ELSE 0 
        END as win_rate,
        ROW_NUMBER() OVER (
          ORDER BY 
            COALESCE(ai_matches_won, 0) DESC, 
            CASE 
              WHEN COALESCE(ai_matches_played, 0) > 0 THEN ROUND((COALESCE(ai_matches_won, 0) * 100.0) / COALESCE(ai_matches_played, 0), 1)
              ELSE 0 
            END DESC
        ) as rank
      FROM stats 
      WHERE COALESCE(ai_matches_played, 0) >= 5  -- Minimum 5 games to qualify
      ORDER BY 
        COALESCE(ai_matches_won, 0) DESC, 
        CASE 
          WHEN COALESCE(ai_matches_played, 0) > 0 THEN ROUND((COALESCE(ai_matches_won, 0) * 100.0) / COALESCE(ai_matches_played, 0), 1)
          ELSE 0 
        END DESC
      LIMIT 30
    `);

    const eligiblePlayers = leaderboardResult.rows
      .map((row: any) => ({
        address: row.player_address,
        wins: row.ai_wins,
        totalGames: row.ai_total_games,
        winRate: row.win_rate,
        rank: row.rank,
        rewardAmount: MONTHLY_REWARDS[row.rank] || 0,
      }))
      .filter(player => player.rewardAmount > 0);

    // Check if distributions already exist for this season
    const existingDistributions = await db.execute({
      sql: `SELECT player_address, reward_amount, status, distributed_at, tx_hash 
            FROM reward_distributions 
            WHERE season_id = ?`,
      args: [seasonId],
    });

    const totalRewards = eligiblePlayers.reduce((sum, player) => sum + player.rewardAmount, 0);
    const { startDate, endDate } = RewardCalculator.getSeasonDates(seasonId);

    return NextResponse.json({
      success: true,
      data: {
        seasonId,
        seasonName: `Month ${seasonId.split("-M")[1]} ${seasonId.split("-M")[0]}`,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        distributions: {
          eligible: eligiblePlayers,
          existing: existingDistributions.rows,
          totalPlayers: eligiblePlayers.length,
          totalRewards,
          hasExistingDistributions: existingDistributions.rows.length > 0,
        },
        instructions: {
          step1: "Review the eligible players and amounts below",
          step2: "Send CELO to each address using your wallet",
          step3: "Record each transaction using POST /api/rewards/distribute",
          step4: "All distributions will be tracked in the database",
        },
      },
    });
  } catch (error) {
    console.error("Error calculating reward distribution:", error);
    return NextResponse.json({ success: false, error: "Failed to calculate reward distribution" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  if (!checkAuth(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { seasonId, playerAddress, txHash, amount } = body;

    if (!seasonId || !playerAddress || !txHash || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: seasonId, playerAddress, txHash, amount" },
        { status: 400 },
      );
    }

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Verify the player is eligible for this season
    const leaderboardResult = await db.execute(
      `
      SELECT 
        address as player_address,
        COALESCE(ai_matches_won, 0) as ai_wins,
        ROW_NUMBER() OVER (ORDER BY COALESCE(ai_matches_won, 0) DESC) as rank
      FROM stats 
      WHERE address = ? AND COALESCE(ai_matches_played, 0) >= 5
    `,
      [playerAddress],
    );

    if (leaderboardResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Player not eligible for rewards" }, { status: 400 });
    }

    const player = leaderboardResult.rows[0] as any;
    const expectedAmount = MONTHLY_REWARDS[player.rank] || 0;

    if (expectedAmount === 0) {
      return NextResponse.json({ success: false, error: "Player not in top 30 for rewards" }, { status: 400 });
    }

    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        { success: false, error: `Amount mismatch. Expected ${expectedAmount} CELO, got ${amount} CELO` },
        { status: 400 },
      );
    }

    // Record the distribution
    const distributionId = `${seasonId}-${playerAddress}`;
    await db.execute({
      sql: `INSERT OR REPLACE INTO reward_distributions 
            (id, season_id, player_address, rank, reward_amount, status, distributed_at, tx_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        distributionId,
        seasonId,
        playerAddress,
        player.rank,
        amount,
        "distributed",
        Math.floor(Date.now() / 1000),
        txHash,
        Math.floor(Date.now() / 1000),
      ],
    });

    // Also record in reward history
    await db.execute({
      sql: `INSERT INTO player_reward_history 
            (player_address, season_id, reward_type, amount, earned_at, claimed_at, tx_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        playerAddress,
        seasonId,
        "monthly",
        amount,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000),
        txHash,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Distribution recorded successfully",
      data: {
        distributionId,
        playerAddress,
        amount,
        txHash,
        rank: player.rank,
        seasonId,
      },
    });
  } catch (error) {
    console.error("Error recording distribution:", error);
    return NextResponse.json({ success: false, error: "Failed to record distribution" }, { status: 500 });
  }
}
