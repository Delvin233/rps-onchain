import { NextResponse } from "next/server";
import { turso } from "~~/lib/turso";
import { redis } from "~~/lib/upstash";

export async function POST() {
  try {
    const results = { users: 0, stats: 0, matches: 0, errors: [] as string[] };

    // Get all stats keys from Redis
    const statsKeys = await redis.keys("stats:*");

    for (const key of statsKeys) {
      try {
        const address = key.replace("stats:", "");
        const statsData = await redis.get(key);

        if (statsData && typeof statsData === "object") {
          const s = statsData as any;

          // Migrate stats
          await turso.execute({
            sql: `INSERT INTO stats (address, total_games, wins, losses, ties, ai_games, ai_wins, multiplayer_games, multiplayer_wins)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(address) DO UPDATE SET
                    total_games = ?,
                    wins = ?,
                    losses = ?,
                    ties = ?,
                    ai_games = ?,
                    ai_wins = ?,
                    multiplayer_games = ?,
                    multiplayer_wins = ?,
                    updated_at = CURRENT_TIMESTAMP`,
            args: [
              address,
              s.totalGames || 0,
              s.wins || 0,
              s.losses || 0,
              s.ties || 0,
              s.ai?.totalGames || 0,
              s.ai?.wins || 0,
              s.multiplayer?.totalGames || 0,
              s.multiplayer?.wins || 0,
              s.totalGames || 0,
              s.wins || 0,
              s.losses || 0,
              s.ties || 0,
              s.ai?.totalGames || 0,
              s.ai?.wins || 0,
              s.multiplayer?.totalGames || 0,
              s.multiplayer?.wins || 0,
            ],
          });

          results.stats++;
        }
      } catch (error: any) {
        results.errors.push(`Stats ${key}: ${error.message}`);
      }
    }

    // Get all history keys from Redis
    const historyKeys = await redis.keys("history:*");

    for (const key of historyKeys) {
      try {
        const matches = await redis.lrange(key, 0, -1);

        for (const matchStr of matches) {
          try {
            const match = typeof matchStr === "string" ? JSON.parse(matchStr) : matchStr;

            const players = [match.players?.creator, match.players?.joiner, match.player, match.address].filter(
              Boolean,
            );

            if (players.length >= 2) {
              const winner = typeof match.result === "object" ? match.result.winner : match.result;

              await turso.execute({
                sql: `INSERT INTO matches (room_id, player1, player2, player1_move, player2_move, winner, game_mode, timestamp_ms, ipfs_hash)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                  match.roomId || "unknown",
                  players[0].toLowerCase(),
                  players[1].toLowerCase(),
                  match.moves?.creatorMove || match.playerMove || "unknown",
                  match.moves?.joinerMove || match.opponentMove || "unknown",
                  winner === "tie" || winner === "Tie" ? null : winner?.toLowerCase() || null,
                  match.opponent === "AI" ? "ai" : "multiplayer",
                  match.timestamp || Date.now(),
                  match.ipfsHash || null,
                ],
              });

              results.matches++;
            }
          } catch (error: any) {
            results.errors.push(`Match in ${key}: ${error.message}`);
          }
        }
      } catch (error: any) {
        results.errors.push(`History ${key}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      migrated: results,
      message: `Migrated ${results.stats} stats and ${results.matches} matches`,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
