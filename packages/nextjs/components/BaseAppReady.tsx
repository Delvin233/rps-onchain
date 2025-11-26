"use client";

import { useEffect } from "react";

export function BaseAppReady() {
  useEffect(() => {
    // Only run in Base app environment
    if (typeof window === "undefined") return;

    // Detect Base app environment (including dev preview)
    const isBaseApp = window.ethereum?.isBaseApp || window.location.href.includes("base.dev/preview");

    if (!isBaseApp) return;

    console.log("Base app environment detected");

    // Lock the wallet provider to prevent conflicts
    if (window.ethereum) {
      // Store reference to the current wallet
      const baseWallet = window.ethereum;

      // Prevent other wallets from overriding
      Object.defineProperty(window, "ethereum", {
        get() {
          return baseWallet;
        },
        set() {
          // Ignore attempts to override
          console.log("Prevented wallet override in Base app");
        },
        configurable: false,
      });
    }

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
