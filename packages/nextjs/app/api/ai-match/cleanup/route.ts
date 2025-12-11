/**
 * AI Match Cleanup Management API
 *
 * Provides endpoints for managing and monitoring the AI match cleanup system
 */
import { NextRequest, NextResponse } from "next/server";
import { aiMatchCleanup, performScheduledCleanup } from "../../../../lib/aiMatchCleanup";
import { withMetricsTracking } from "../../../../lib/aiMatchMetrics";

/**
 * GET /api/ai-match/cleanup
 * Get cleanup job status and statistics
 */
export const GET = withMetricsTracking("cleanup_status", async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "status":
        const jobStatus = aiMatchCleanup.getJobStatus();
        return NextResponse.json({
          success: true,
          data: jobStatus,
        });

      case "stats":
        const stats = await aiMatchCleanup.getCleanupStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });

      default:
        // Return both status and stats by default
        const [status, statistics] = await Promise.all([
          aiMatchCleanup.getJobStatus(),
          aiMatchCleanup.getCleanupStats(),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            jobStatus: status,
            statistics,
          },
        });
    }
  } catch (error) {
    console.error("[Cleanup API] Error getting cleanup info:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get cleanup information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});

/**
 * POST /api/ai-match/cleanup
 * Control cleanup job operations
 */
export const POST = withMetricsTracking("cleanup_control", async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "start":
        // No separate cron job - cleanup is handled by existing Vercel cron
        return NextResponse.json({
          success: true,
          message: "Cleanup monitoring ready (uses existing Vercel cron)",
          data: {
            note: "Cleanup is handled by /api/cron/cleanup-rooms to avoid Vercel cron limits",
            jobStatus: aiMatchCleanup.getJobStatus(),
          },
        });

      case "stop":
        // No separate cron job to stop
        return NextResponse.json({
          success: true,
          message: "No separate cleanup job running (uses Vercel cron)",
          data: aiMatchCleanup.getJobStatus(),
        });

      case "force":
        const metrics = await aiMatchCleanup.forceCleanup();
        return NextResponse.json({
          success: true,
          message: "Force cleanup completed",
          data: {
            cleanupMetrics: metrics,
            jobStatus: aiMatchCleanup.getJobStatus(),
          },
        });

      case "run":
        // Run cleanup using the legacy API for compatibility
        const result = await performScheduledCleanup({
          deleteAbandonedOlderThanDays: 7,
          cleanupExpiredActive: true,
          logResults: true,
        });

        return NextResponse.json({
          success: result.success,
          message: result.success ? "Cleanup operation completed" : "Cleanup operation failed",
          data: {
            cleanupResult: result,
            jobStatus: aiMatchCleanup.getJobStatus(),
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action",
            validActions: ["start", "stop", "force", "run"],
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("[Cleanup API] Error controlling cleanup job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to control cleanup job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});

/**
 * DELETE /api/ai-match/cleanup
 * Emergency cleanup - force cleanup all expired matches
 */
export const DELETE = withMetricsTracking("emergency_cleanup", async () => {
  try {
    console.log("[Cleanup API] Emergency cleanup requested");

    // Force cleanup with extended limits for emergency situations
    const metrics = await aiMatchCleanup.forceCleanup();

    return NextResponse.json({
      success: true,
      message: "Emergency cleanup completed",
      data: {
        cleanupMetrics: metrics,
        jobStatus: aiMatchCleanup.getJobStatus(),
      },
    });
  } catch (error) {
    console.error("[Cleanup API] Error during emergency cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Emergency cleanup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
