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

  // Default values for SSR
  const defaultValues = {
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
    status: "disconnected" as const,
  };

  // Return default values during SSR, wagmi values on client
  return isClient ? wagmiAccount : defaultValues;
};
