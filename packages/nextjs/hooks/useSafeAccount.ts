"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

/**
 * Safe wrapper around useAccount that prevents SSR issues
 * Returns default values during SSR and hydrates on client
 */
export const useSafeAccount = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Always call the hook to follow rules of hooks
  const wagmiAccount = useAccount();

  // If not on client yet, return safe defaults while preserving the structure
  if (!isClient) {
    return {
      ...wagmiAccount,
      address: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
      status: "disconnected" as const,
      chain: undefined,
      chainId: undefined,
    };
  }

  // On client, return the actual wagmi account
  return wagmiAccount;
};
