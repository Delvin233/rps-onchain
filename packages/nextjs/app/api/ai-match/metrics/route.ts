/**
 * AI Match Metrics API
 *
 * GET /api/ai-match/metrics
 *
 * Provides performance metrics and monitoring data for the AI match system.
 * This endpoint is intended for monitoring dashboards and system health checks.
 */
import { NextRequest, NextResponse } from "next/server";
import { aiMatchMetrics } from "../../../../lib/aiMatchMetrics";
import { withMetricsTracking } from "../../../../lib/aiMatchMetrics";

/**
 * GET /api/ai-match/metrics
 *
 * Returns comprehensive performance metrics for the AI match system
 */
async function getMetricsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "full";

    if (type === "monitoring") {
      // Return simplified metrics for monitoring dashboard
      const monitoringMetrics = await aiMatchMetrics.getMonitoringMetrics();
      return NextResponse.json({
        success: true,
        data: monitoringMetrics,
      });
    } else {
      // Return full metrics
      const metrics = await aiMatchMetrics.getMetrics();
      return NextResponse.json({
        success: true,
        data: metrics,
      });
    }
  } catch (error) {
    console.error("[AI Match Metrics API] Error getting metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Apply metrics tracking to the handler
export const GET = withMetricsTracking("metrics", getMetricsHandler);
