"use client";

import { useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";

export function BaseAppReady() {
  useEffect(() => {
    // Call ready() as soon as possible to hide splash screen
    sdk.actions.ready().catch(console.error);
  }, []);

  return null;
}
