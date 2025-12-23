"use client";

import { ReactNode } from "react";
import { MiniAppProvider } from "@neynar/react";

interface NeynarMiniAppProviderProps {
  children: ReactNode;
}

/**
 * Neynar MiniApp Provider for enhanced Farcaster miniapp integration
 * Provides better analytics and notification management
 */
export function NeynarMiniAppProvider({ children }: NeynarMiniAppProviderProps) {
  if (process.env.NODE_ENV === "development") {
    console.log("[Neynar] MiniAppProvider initialized");
  }

  return <MiniAppProvider>{children}</MiniAppProvider>;
}
