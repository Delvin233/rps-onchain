import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with stats
    const keys = await redis.keys('stats:*');
    const addresses = keys.map(key => key.replace('stats:', ''));
    
    let synced = 0;
    let errors = 0;
    
    // Sync each user
    for (const address of addresses) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/sync-ipfs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        
        if (response.ok) {
          synced++;
        } else {
          errors++;
        }
      } catch (error) {
        errors++;
        console.error(`Failed to sync ${address}:`, error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      synced, 
      errors,
      total: addresses.length 
    });
  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}