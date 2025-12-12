/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */
"use client";

import { useEffect, useRef } from "react";

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

/**
 * Service Initializer Component
 *
 * Initializes monitoring and metrics collection (no separate cron jobs)
 * since we integrate with existing Vercel cron jobs to avoid daily limits
 */

let servicesInitialized = false;

export function ServiceInitializer() {
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initRef.current || servicesInitialized) {
      return;
    }

    initRef.current = true;

    const initializeServices = async () => {
      try {
        console.log("[ServiceInitializer] Initializing monitoring services...");

        // Just check the cleanup status to ensure the system is ready
        // No separate cron job needed - we integrate with existing ones
        const response = await fetch("/api/ai-match/cleanup?action=status");

        if (response.ok) {
          const result = await response.json();
          console.log("[ServiceInitializer] Monitoring services ready:", result.data);
          servicesInitialized = true;
        } else {
          console.warn("[ServiceInitializer] Monitoring services not ready:", response.status);
        }
      } catch (error) {
        console.error("[ServiceInitializer] Error initializing monitoring:", error);
      }
    };

    // Initialize services after a short delay to allow the app to load
    const timeoutId = setTimeout(initializeServices, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
