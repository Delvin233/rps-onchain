import { NextRequest, NextResponse } from "next/server";
import { performScheduledCleanup } from "~~/lib/aiMatchCleanup";
import { roomStorage } from "~~/lib/roomStorage";
import { redis } from "~~/lib/upstash";

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
      matchHistoryChecked: 0,
      matchHistoryExpired: 0,
      aiMatchCleanup: {
        success: false,
        expiredActiveMatches: 0,
        deletedAbandonedMatches: 0,
      },
    };

    // Cleanup free rooms (older than 1 hour - increased from 10 minutes for better sharing)
    // Paid rooms are kept longer for better sharing experience
    const freeRooms = await roomStorage.getAll();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour for free rooms
    const sixHours = 6 * 60 * 60 * 1000; // 6 hours for paid rooms

    for (const room of freeRooms) {
      results.freeRoomsChecked++;
      const ageThreshold = room.isFree ? oneHour : sixHours;

      if (now - room.createdAt > ageThreshold) {
        await roomStorage.delete(room.roomId, room.chainId);
        results.freeRoomsDeleted++;
      }
    }

    // Cleanup old match history (older than 30 days - separate from room cleanup)
    try {
      const historyKeys = await redis.keys("history:*");
      const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days

      for (const key of historyKeys) {
        results.matchHistoryChecked++;

        // Get the oldest match in the list to check age
        const oldestMatch = await redis.lrange(key, -1, -1);
        if (oldestMatch.length > 0) {
          try {
            const match = typeof oldestMatch[0] === "string" ? JSON.parse(oldestMatch[0]) : oldestMatch[0];
            const matchTime = typeof match.result === "object" ? match.result.timestamp : match.timestamp || 0;

            if (matchTime && now - matchTime > thirtyDays) {
              // Remove old matches from the end of the list (oldest first)
              const allMatches = await redis.lrange(key, 0, -1);
              let keepCount = 0;

              // Count how many matches to keep (newer than 30 days)
              for (let i = 0; i < allMatches.length; i++) {
                try {
                  const m = typeof allMatches[i] === "string" ? JSON.parse(allMatches[i]) : allMatches[i];
                  const mTime = typeof m.result === "object" ? m.result.timestamp : m.timestamp || 0;
                  if (mTime && now - mTime <= thirtyDays) {
                    keepCount = allMatches.length - i;
                    break;
                  }
                } catch (parseError) {
                  // Keep unparseable matches - log the error for debugging
                  console.warn(
                    `Error parsing match for cleanup: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
                  );
                  keepCount = allMatches.length - i;
                  break;
                }
              }

              if (keepCount < allMatches.length) {
                // Trim to keep only recent matches
                await redis.ltrim(key, 0, keepCount - 1);
                results.matchHistoryExpired += allMatches.length - keepCount;
              }
            }
          } catch (parseError) {
            console.error(`Error parsing match history for cleanup: ${key}`, parseError);
          }
        }
      }
    } catch (error) {
      console.error("Error during match history cleanup:", error);
    }

    // Cleanup AI matches (expired active matches and old abandoned matches)
    try {
      const aiCleanupResult = await performScheduledCleanup({
        deleteAbandonedOlderThanDays: 7, // Delete abandoned matches older than 7 days
        cleanupExpiredActive: true, // Clean up expired active matches from Redis
        logResults: true, // Log cleanup results
      });

      if (aiCleanupResult.success && aiCleanupResult.results) {
        results.aiMatchCleanup = {
          success: true,
          expiredActiveMatches: aiCleanupResult.results.expiredActiveMatches,
          deletedAbandonedMatches: aiCleanupResult.results.deletedAbandonedMatches,
        };
      }
    } catch (error) {
      console.error("Error during AI match cleanup:", error);
      // Don't fail the entire cron job if AI cleanup fails
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
