import { NextResponse } from "next/server";
import { dbPool } from "~~/lib/database-pool";
import { redis } from "~~/lib/upstash";

export async function GET() {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      database: {
        pool: dbPool.getPoolStats(),
      },
      redis: {} as any,
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
      },
      cache: {
        // We'll add cache hit/miss ratios later
      },
    };

    // Try to ping Redis to check connectivity
    try {
      await redis.ping();
      metrics.redis = {
        connected: true,
        status: "Available",
      };
    } catch (error) {
      metrics.redis = {
        connected: false,
        status: "Error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };
    }

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
