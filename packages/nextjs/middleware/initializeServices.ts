/**
 * Service Initialization Middleware
 *
 * Ensures that background services are initialized before handling requests
 */
import { NextRequest, NextResponse } from "next/server";
import { areServicesInitialized, initializeServices } from "../lib/startup";

let initializationPromise: Promise<void> | null = null;

/**
 * Middleware to ensure services are initialized
 */
export async function ensureServicesInitialized(
  request: NextRequest,
  next: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    // Check if services are already initialized
    if (areServicesInitialized()) {
      return await next();
    }

    // If initialization is already in progress, wait for it
    if (initializationPromise) {
      await initializationPromise;
      return await next();
    }

    // Start initialization
    if (process.env.NODE_ENV === "development") {
      console.log("[Middleware] Initializing services on first request...");
    }
    initializationPromise = initializeServices();

    try {
      await initializationPromise;
      if (process.env.NODE_ENV === "development") {
        console.log("[Middleware] Services initialized successfully");
      }
    } catch (error) {
      console.error("[Middleware] Service initialization failed:", error);
      // Continue with request even if initialization fails
      // Services will retry on next request
    } finally {
      initializationPromise = null;
    }

    return await next();
  } catch (error) {
    console.error("[Middleware] Error in service initialization middleware:", error);
    return await next(); // Continue with request even if middleware fails
  }
}

/**
 * Wrapper function for API routes to ensure services are initialized
 */
export function withServiceInitialization<T extends (...args: any[]) => Promise<NextResponse>>(handler: T): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;

    return await ensureServicesInitialized(request, async () => {
      return await handler(...args);
    });
  }) as T;
}
