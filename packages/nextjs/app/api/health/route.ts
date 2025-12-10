import { NextResponse } from "next/server";
import { dbPool } from "~~/lib/database-pool";
import { redis } from "~~/lib/upstash";

export async function GET() {
  const startTime = Date.now();
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {} as any,
    performance: {} as any,
  };

  try {
    // Test database connection
    const dbStart = Date.now();
    try {
      await dbPool.withConnection(async client => {
        await client.execute("SELECT 1");
      });
      health.services.database = {
        status: "healthy",
        responseTime: Date.now() - dbStart,
        poolStats: dbPool.getPoolStats(),
      };
    } catch (error) {
      health.services.database = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - dbStart,
      };
      health.status = "degraded";
    }

    // Test Redis connection
    const redisStart = Date.now();
    try {
      await redis.ping();
      health.services.redis = {
        status: "healthy",
        responseTime: Date.now() - redisStart,
      };
    } catch (error) {
      health.services.redis = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - redisStart,
      };
      health.status = "degraded";
    }

    // Performance metrics
    health.performance = {
      totalResponseTime: Date.now() - startTime,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };

    const statusCode = health.status === "healthy" ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
