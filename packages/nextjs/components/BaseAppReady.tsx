"use client";

import { useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";

export function BaseAppReady() {
  useEffect(() => {
    // Call ready immediately - don't wait for context
    sdk.actions
      .ready()
      .then(() => console.log("SDK ready() called successfully"))
      .catch(error => {
        console.error("SDK ready() failed:", error);
        // Retry after short delay
        setTimeout(() => {
          sdk.actions.ready().catch(console.error);
        }, 500);
      });
  }, []);

  return null;
}
