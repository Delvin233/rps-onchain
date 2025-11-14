import { NextRequest, NextResponse } from "next/server";
import { roomStorage } from "~~/lib/roomStorage";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      freeRoomsChecked: 0,
      freeRoomsDeleted: 0,
    };

    // Cleanup free rooms (older than 10 minutes)
    const freeRooms = await roomStorage.getAll();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    for (const room of freeRooms) {
      results.freeRoomsChecked++;
      if (now - room.createdAt > tenMinutes) {
        await roomStorage.delete(room.roomId, room.chainId);
        results.freeRoomsDeleted++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in cleanup cron:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
