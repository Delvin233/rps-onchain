"use client";

import { useEffect, useState } from "react";

/**
 * Safe wrapper that provides AppKit functionality without causing initialization errors
 * Returns safe defaults until AppKit is properly initialized
 */
export const useSafeAppKit = () => {
  const [isAppKitReady, setIsAppKitReady] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if AppKit is initialized
    const checkAppKitReady = () => {
      try {
        // Look for AppKit modal or instance
        const hasAppKit =
          document.querySelector("w3m-modal") ||
          document.querySelector('[data-testid="w3m-modal"]') ||
          (window as any).__appkit_instance;

        if (hasAppKit) {
          setIsAppKitReady(true);
        }
      } catch {
        // Ignore errors during checking
      }
    };

    // Check periodically until AppKit is ready
    const interval = setInterval(() => {
      if (!isAppKitReady) {
        checkAppKitReady();
      } else {
        clearInterval(interval);
      }
    }, 100);

    // Listen for AppKit ready event
    const handleAppKitReady = () => setIsAppKitReady(true);
    window.addEventListener("appkit-ready", handleAppKitReady);

    return () => {
      clearInterval(interval);
      window.removeEventListener("appkit-ready", handleAppKitReady);
    };
  }, [isAppKitReady]);

  // Safe AppKit methods
  const open = () => {
    if (!isAppKitReady) {
      console.warn("[useSafeAppKit] AppKit not ready yet");
      return;
    }

    try {
      // Try to find and use AppKit's open method
      const modal = document.querySelector("w3m-modal") as any;
      if (modal && typeof modal.open === "function") {
        modal.open();
      } else {
        // Fallback: dispatch a custom event that AppKit might listen to
        window.dispatchEvent(new CustomEvent("appkit-open"));
      }
    } catch (error) {
      console.error("[useSafeAppKit] Error opening AppKit:", error);
    }
  };

  const close = () => {
    if (!isAppKitReady) {
      console.warn("[useSafeAppKit] AppKit not ready yet");
      return;
    }

    try {
      const modal = document.querySelector("w3m-modal") as any;
      if (modal && typeof modal.close === "function") {
        modal.close();
      } else {
        window.dispatchEvent(new CustomEvent("appkit-close"));
      }
    } catch (error) {
      console.error("[useSafeAppKit] Error closing AppKit:", error);
    }
  };

  return {
    open,
    close,
    isReady: isAppKitReady,
  };
};
