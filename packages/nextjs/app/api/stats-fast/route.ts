import { NextRequest, NextResponse } from "next/server";
import { redis } from "~~/lib/upstash";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();
    
    const statsData = await redis.get(`stats:${addressLower}`);
    const stats = statsData ? statsData : { 
      totalGames: 0, 
      wins: 0, 
      losses: 0, 
      ties: 0, 
      winRate: 0 
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching fast stats:", error);
    return NextResponse.json({ 
      stats: { totalGames: 0, wins: 0, losses: 0, ties: 0, winRate: 0 } 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, result } = await request.json();
    
    if (!address || !result) {
      return NextResponse.json({ error: "Address and result required" }, { status: 400 });
    }

    const addressLower = address.toLowerCase();
    
    // Get current stats
    const statsData = await redis.get(`stats:${addressLower}`);
    const stats = statsData ? statsData : { 
      totalGames: 0, 
      wins: 0, 
      losses: 0, 
      ties: 0, 
      winRate: 0 
    };
    
    // Update stats
    stats.totalGames++;
    if (result === "win") stats.wins++;
    else if (result === "lose") stats.losses++;
    else if (result === "tie") stats.ties++;
    
    stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
    
    // Store updated stats
    await redis.set(`stats:${addressLower}`, stats);
    
    // Store match in history
    const match = {
      timestamp: new Date().toISOString(),
      result,
      player: address,
      opponent: "AI"
    };
    
    await redis.lpush(`history:${addressLower}`, JSON.stringify(match));
    await redis.ltrim(`history:${addressLower}`, 0, 99); // Keep last 100
    
    // IPFS sync handled by daily cron job
    
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error updating fast stats:", error);
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
  }
}