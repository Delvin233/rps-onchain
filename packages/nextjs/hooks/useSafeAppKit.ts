"use client";

import { useEffect, useState } from "react";

/**
 * Safe wrapper that provides AppKit functionality
 * Falls back to direct AppKit usage when available
 */
export const useSafeAppKit = () => {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const open = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[useSafeAppKit] Open called");
    }

    if (!isClient) {
      console.warn("[useSafeAppKit] Not on client side");
      return;
    }

    try {
      // Method 1: Try to find and click existing AppKit elements
      const selectors = [
        "w3m-connect-button",
        '[data-testid="connect-button"]',
        "w3m-button",
        '[class*="w3m-connect"]',
        "appkit-button",
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && typeof element.click === "function") {
          if (process.env.NODE_ENV === "development") {
            console.log(`[useSafeAppKit] Found element with selector: ${selector}`);
          }
          element.click();
          return;
        }
      }

      // Method 2: Try to open modal directly
      const modal = document.querySelector("w3m-modal") as any;
      if (modal && typeof modal.open === "function") {
        if (process.env.NODE_ENV === "development") {
          console.log("[useSafeAppKit] Opening modal directly");
        }
        modal.open();
        return;
      }

      // Method 3: Try global AppKit instance
      if ((window as any).appkit && typeof (window as any).appkit.open === "function") {
        if (process.env.NODE_ENV === "development") {
          console.log("[useSafeAppKit] Using global appkit instance");
        }
        (window as any).appkit.open();
        return;
      }

      // Method 4: Dispatch event for AppKit to listen to
      if (process.env.NODE_ENV === "development") {
        console.log("[useSafeAppKit] Dispatching appkit-open event");
      }
      window.dispatchEvent(new CustomEvent("appkit-open"));

      // Method 5: Try to trigger AppKit through any available means
      const appKitElements = document.querySelectorAll('[class*="appkit"], [class*="w3m"]');
      if (appKitElements.length > 0) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[useSafeAppKit] Found ${appKitElements.length} potential AppKit elements`);
        }
        (appKitElements[0] as HTMLElement).click?.();
      }
    } catch (error) {
      console.error("[useSafeAppKit] Error opening AppKit:", error);
    }
  };

  const close = () => {
    if (!isClient) return;

    try {
      const modal = document.querySelector("w3m-modal") as any;
      if (modal && typeof modal.close === "function") {
        modal.close();
      }
    } catch (error) {
      console.error("[useSafeAppKit] Error closing AppKit:", error);
    }
  };

  return {
    open,
    close,
    isReady: isClient,
  };
};
