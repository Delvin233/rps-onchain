/**
 * Application Startup Initialization
 *
 * Handles initialization of monitoring and metrics systems.
 * No separate cron jobs are started to avoid Vercel's daily cron limit.
 * Cleanup is handled by existing cron jobs in /api/cron/cleanup-rooms
 */

let isInitialized = false;

/**
 * Initialize monitoring services (no cron jobs)
 */
export async function initializeServices(): Promise<void> {
  if (isInitialized) {
    console.log("[Startup] Services already initialized, skipping...");
    return;
  }

  console.log("[Startup] Initializing monitoring services...");

  try {
    // Initialize metrics collection (no background jobs)
    // The actual cleanup is handled by existing Vercel cron jobs

    // Mark as initialized
    isInitialized = true;

    console.log("[Startup] Monitoring services initialized successfully");
  } catch (error) {
    console.error("[Startup] Failed to initialize services:", error);
    throw error;
  }
}

/**
 * Graceful shutdown of all services
 */
export function shutdownServices(): void {
  if (!isInitialized) {
    console.log("[Startup] Services not initialized, nothing to shutdown");
    return;
  }

  console.log("[Startup] Shutting down monitoring services...");

  try {
    // No background jobs to shutdown since we use Vercel cron

    // Mark as not initialized
    isInitialized = false;

    console.log("[Startup] All services shutdown successfully");
  } catch (error) {
    console.error("[Startup] Error during service shutdown:", error);
  }
}

/**
 * Setup process event handlers for graceful shutdown
 */
export function setupGracefulShutdown(): void {
  // Handle process termination signals
  process.on("SIGTERM", () => {
    console.log("[Startup] SIGTERM received, shutting down gracefully...");
    shutdownServices();
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("[Startup] SIGINT received, shutting down gracefully...");
    shutdownServices();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", error => {
    console.error("[Startup] Uncaught exception:", error);
    shutdownServices();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[Startup] Unhandled rejection at:", promise, "reason:", reason);
    shutdownServices();
    process.exit(1);
  });
}

/**
 * Check if services are initialized
 */
export function areServicesInitialized(): boolean {
  return isInitialized;
}
