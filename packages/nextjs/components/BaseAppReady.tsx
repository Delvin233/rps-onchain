"use client";

import { useEffect } from "react";

export function BaseAppReady() {
  useEffect(() => {
    // Only run in Base app environment
    if (typeof window === "undefined" || !window.ethereum?.isBaseApp) return;

    // Dynamic import to reduce bundle size
    import("@farcaster/miniapp-sdk")
      .then(({ default: sdk }) => {
        return sdk.actions.ready();
      })
      .then(() => console.log("SDK ready() called successfully"))
      .catch(error => {
        console.error("SDK ready() failed:", error);
        // Retry after short delay
        setTimeout(() => {
          import("@farcaster/miniapp-sdk").then(({ default: sdk }) => sdk.actions.ready()).catch(console.error);
        }, 500);
      });
  }, []);

  return null;
}
