"use client";

import { useAuth } from "~~/contexts/AuthContext";
import { useSafeAccount } from "~~/hooks/useSafeAccount";

/**
 * Hook that returns the connected address from either wagmi or Farcaster auth
 * Use this instead of useAccount() to support both wallet and Farcaster connections
 */
export const useConnectedAddress = () => {
  const { address: authAddress, authMethod, isAuthenticated } = useAuth();
  const { address: wagmiAddress, isConnected: wagmiConnected, isConnecting } = useSafeAccount();

  // Prioritize Farcaster address, fall back to wagmi
  // Ensure address is always lowercase for consistency
  const rawAddress = authAddress || wagmiAddress;
  const address = rawAddress?.toLowerCase() || null;
  const isConnected = isAuthenticated || wagmiConnected;

  return {
    address,
    isConnected,
    isConnecting,
    authMethod,
  };
};
