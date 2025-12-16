"use client";

import { useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";

/**
 * Safe wrapper around useAppKit that prevents initialization errors
 * Returns safe defaults until AppKit is properly initialized
 */
export const useSafeAppKit = () => {
  const [isAppKitReady, setIsAppKitReady] = useState(false);

  useEffect(() => {
    // Check if AppKit is initialized by looking for the modal element
    const checkAppKitReady = () => {
      // AppKit creates a modal element when initialized
      const appKitModal =
        document.querySelector("w3m-modal") ||
        document.querySelector('[data-testid="w3m-modal"]') ||
        // Check if the AppKit instance exists on window
        (window as any).__appkit_instance;

      if (appKitModal || (window as any).__appkit_instance) {
        setIsAppKitReady(true);
      }
    };

    // Check immediately
    checkAppKitReady();

    // Also check after a short delay to catch late initialization
    const timer = setTimeout(checkAppKitReady, 100);

    // Listen for AppKit initialization events
    const handleAppKitReady = () => setIsAppKitReady(true);
    window.addEventListener("appkit-ready", handleAppKitReady);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("appkit-ready", handleAppKitReady);
    };
  }, []);

  // Always call the hook to follow rules of hooks
  const appKit = useAppKit();

  // Default safe values for when AppKit is not ready
  const defaultAppKit = {
    open: () => {
      if (!isAppKitReady) {
        console.warn("[useSafeAppKit] AppKit not ready yet, ignoring open() call");
        return;
      }
      // If ready, try to call the real open function
      appKit?.open?.();
    },
    close: () => {
      if (!isAppKitReady) {
        console.warn("[useSafeAppKit] AppKit not ready yet, ignoring close() call");
        return;
      }
      // If ready, try to call the real close function
      appKit?.close?.();
    },
  };

  // Return the safe wrapper with ready state
  return {
    ...defaultAppKit,
    isReady: isAppKitReady,
  };
};
