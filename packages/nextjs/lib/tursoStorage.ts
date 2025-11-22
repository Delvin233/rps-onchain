import { turso } from "./turso";

// Users
export async function upsertUser(address: string, username?: string) {
  await turso.execute({
    sql: `INSERT INTO users (address, username, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(address) DO UPDATE SET username = ?, updated_at = CURRENT_TIMESTAMP`,
    args: [address.toLowerCase(), username || null, username || null],
  });
}

// Stats
export async function getStats(address: string) {
  const result = await turso.execute({
    sql: "SELECT * FROM stats WHERE address = ?",
    args: [address.toLowerCase()],
  });
  return result.rows[0] || null;
}

export async function updateStats(address: string, isWin: boolean, isTie: boolean, isAI: boolean) {
  const addr = address.toLowerCase();
  await turso.execute({
    sql: `INSERT INTO stats (address, total_games, wins, losses, ties, ai_games, ai_wins, ai_ties, multiplayer_games, multiplayer_wins, multiplayer_ties)
          VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(address) DO UPDATE SET
            total_games = total_games + 1,
            wins = wins + ?,
            losses = losses + ?,
            ties = ties + ?,
            ai_games = ai_games + ?,
            ai_wins = ai_wins + ?,
            ai_ties = ai_ties + ?,
            multiplayer_games = multiplayer_games + ?,
            multiplayer_wins = multiplayer_wins + ?,
            multiplayer_ties = multiplayer_ties + ?,
            updated_at = CURRENT_TIMESTAMP`,
    args: [
      addr,
      isWin ? 1 : 0,
      !isWin && !isTie ? 1 : 0,
      isTie ? 1 : 0,
      isAI ? 1 : 0,
      isAI && isWin ? 1 : 0,
      isAI && isTie ? 1 : 0,
      !isAI ? 1 : 0,
      !isAI && isWin ? 1 : 0,
      !isAI && isTie ? 1 : 0,
      isWin ? 1 : 0,
      !isWin && !isTie ? 1 : 0,
      isTie ? 1 : 0,
      isAI ? 1 : 0,
      isAI && isWin ? 1 : 0,
      isAI && isTie ? 1 : 0,
      !isAI ? 1 : 0,
      !isAI && isWin ? 1 : 0,
      !isAI && isTie ? 1 : 0,
    ],
  });
}

// Matches
export async function saveMatch(data: {
  roomId: string;
  player1: string;
  player2: string;
  player1Move: string;
  player2Move: string;
  winner: string | null;
  gameMode: string;
  timestampMs: number;
  ipfsHash?: string;
}) {
  await turso.execute({
    sql: `INSERT INTO matches (room_id, player1, player2, player1_move, player2_move, winner, game_mode, timestamp_ms, ipfs_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.roomId,
      data.player1.toLowerCase(),
      data.player2.toLowerCase(),
      data.player1Move,
      data.player2Move,
      data.winner?.toLowerCase() || null,
      data.gameMode,
      data.timestampMs,
      data.ipfsHash || null,
    ],
  });
}

export async function getMatchHistory(address: string, limit = 50) {
  const addr = address.toLowerCase();
  const result = await turso.execute({
    sql: `SELECT * FROM matches WHERE player1 = ? OR player2 = ? ORDER BY timestamp_ms DESC LIMIT ?`,
    args: [addr, addr, limit],
  });
  return result.rows;
}
