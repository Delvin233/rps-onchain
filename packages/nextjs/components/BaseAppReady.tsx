"use client";

import { useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";

export function BaseAppReady() {
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Wait for SDK to be ready before calling actions
        await sdk.context;
        await sdk.actions.ready();
        console.log("SDK ready() called successfully");
      } catch (error) {
        console.error("SDK ready() failed:", error);
        // Fallback: try calling ready() anyway after a delay
        setTimeout(() => {
          sdk.actions.ready().catch(console.error);
        }, 1000);
      }
    };

    initializeSDK();
  }, []);

  return null;
}
