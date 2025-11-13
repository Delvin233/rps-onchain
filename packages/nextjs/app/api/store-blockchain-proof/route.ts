import { NextRequest, NextResponse } from "next/server";
import { initBlockchainProofsTable, turso } from "~~/lib/turso";

export async function POST(request: NextRequest) {
  try {
    const { roomId, matchKey, txHash, chainId } = await request.json();

    if (!roomId || !txHash || !matchKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure table exists
    await initBlockchainProofsTable();

    // Store blockchain proof in Turso
    await turso.execute({
      sql: `INSERT OR REPLACE INTO blockchain_proofs (match_key, room_id, tx_hash, chain_id, timestamp_ms) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [matchKey, roomId, txHash, chainId, Date.now()],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing blockchain proof:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    await initBlockchainProofsTable();

    // Get all proofs for a room
    if (roomId) {
      const result = await turso.execute({
        sql: "SELECT * FROM blockchain_proofs WHERE room_id = ? ORDER BY timestamp_ms DESC",
        args: [roomId],
      });

      const proofs: Record<string, any> = {};
      for (const row of result.rows) {
        proofs[row.room_id as string] = {
          txHash: row.tx_hash,
          chainId: row.chain_id,
          timestamp: row.timestamp_ms,
          createdAt: row.created_at,
        };
      }

      return NextResponse.json({ proofs });
    }

    return NextResponse.json({ error: "Room ID required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching blockchain proof:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
