"use client";

import { useEffect, useRef } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useSafeAccount } from "~~/hooks/useSafeAccount";

/**
 * Hook to help maintain wallet connection state across tab switches
 * This addresses the common issue where AppKit/wagmi lose connection state
 * when users switch tabs and come back
 */
export function useConnectionPersistence() {
  const { isConnected: wagmiConnected } = useSafeAccount();
  const { isConnected: appKitConnected } = useAppKitAccount();
  const lastConnectionState = useRef({ wagmi: false, appKit: false });
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Store connection state when tab becomes hidden
        lastConnectionState.current = {
          wagmi: wagmiConnected,
          appKit: appKitConnected,
        };
      } else {
        // Tab became visible - check if we lost connection
        const wasConnected = lastConnectionState.current.wagmi || lastConnectionState.current.appKit;
        const isCurrentlyConnected = wagmiConnected || appKitConnected;

        if (wasConnected && !isCurrentlyConnected && reconnectAttempts.current < maxReconnectAttempts) {
          console.log("[ConnectionPersistence] Attempting to restore connection...");
          reconnectAttempts.current++;

          // Try to trigger reconnection by dispatching events
          setTimeout(() => {
            window.dispatchEvent(new Event("wallet-reconnect"));

            // Reset attempts after successful reconnection or timeout
            setTimeout(() => {
              if (wagmiConnected || appKitConnected) {
                reconnectAttempts.current = 0;
              }
            }, 2000);
          }, 500);
        } else if (isCurrentlyConnected) {
          // Reset attempts on successful connection
          reconnectAttempts.current = 0;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [wagmiConnected, appKitConnected]);

  // Reset attempts when connection is restored
  useEffect(() => {
    if (wagmiConnected || appKitConnected) {
      reconnectAttempts.current = 0;
    }
  }, [wagmiConnected, appKitConnected]);

  return {
    isConnected: wagmiConnected || appKitConnected,
    reconnectAttempts: reconnectAttempts.current,
  };
}
