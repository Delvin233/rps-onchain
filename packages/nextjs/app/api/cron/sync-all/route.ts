import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with stats
    const keys = await redis.keys("stats:*");
    const addresses = keys.map(key => key.replace("stats:", ""));

    let synced = 0;
    let skipped = 0;
    let errors = 0;
    const syncResults: any[] = [];

    // Sync each user with rate limiting
    for (const address of addresses) {
      try {
        // Check if user has any matches to sync
        const historyLength = await redis.llen(`history:${address}`);

        if (historyLength === 0) {
          skipped++;
          syncResults.push({ address, status: "skipped", reason: "no_matches" });
          continue;
        }

        // Get all matches from Redis
        const redisMatches = await redis.lrange(`history:${address}`, 0, -1);
        const parsedMatches = redisMatches.map((m: any) => (typeof m === "string" ? JSON.parse(m) : m));

        // Deduplicate matches by timestamp + moves
        const uniqueMatches = Array.from(
          new Map(
            parsedMatches.map(m => {
              const key =
                m.opponent === "AI"
                  ? `ai-${m.timestamp}-${m.player}`
                  : `match-${m.roomId}-${m.timestamp || Date.now()}`;
              return [key, m];
            }),
          ).values(),
        );

        // Only sync if we have unique matches
        if (uniqueMatches.length === 0) {
          skipped++;
          syncResults.push({ address, status: "skipped", reason: "no_unique_matches" });
          continue;
        }

        // Sync to IPFS with deduplication
        const response = await fetch(`${request.nextUrl.origin}/api/sync-ipfs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, matches: uniqueMatches }),
        });

        if (response.ok) {
          synced++;
          syncResults.push({
            address,
            status: "synced",
            matchCount: uniqueMatches.length,
          });
        } else {
          errors++;
          const errorData = await response.json();
          syncResults.push({
            address,
            status: "error",
            error: errorData.error,
          });
        }

        // Rate limiting: Wait 500ms between syncs to avoid hitting Pinata limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        errors++;
        console.error(`Failed to sync ${address}:`, error);
        syncResults.push({
          address,
          status: "error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      errors,
      total: addresses.length,
      results: syncResults,
    });
  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
