import { NextResponse } from "next/server";
import { circuitBreakers } from "~~/lib/circuit-breaker";

/**
 * Circuit Breaker Status Monitoring Endpoint
 *
 * Returns the current state of all circuit breakers for monitoring
 * and debugging purposes.
 *
 * GET /api/circuit-breaker-status
 */
export async function GET() {
  try {
    const statuses = await Promise.all([
      circuitBreakers.database.getState(),
      circuitBreakers.redis.getState(),
      circuitBreakers.external_api.getState(),
      circuitBreakers.ipfs.getState(),
    ]);

    const response = {
      timestamp: new Date().toISOString(),
      circuit_breakers: statuses.reduce(
        (acc, status) => {
          acc[status.name] = {
            state: status.state,
            failures: status.failures,
            config: {
              failureThreshold: status.config.failureThreshold,
              recoveryTimeout: status.config.recoveryTimeout,
              successThreshold: status.config.successThreshold,
            },
          };
          return acc;
        },
        {} as Record<string, any>,
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Circuit Breaker Status] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get circuit breaker status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
