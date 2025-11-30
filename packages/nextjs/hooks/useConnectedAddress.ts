"use client";

import { useAccount } from "wagmi";
import { useAuth } from "~~/contexts/AuthContext";

/**
 * Hook that returns the connected address from either wagmi or Farcaster auth
 * Use this instead of useAccount() to support both wallet and Farcaster connections
 */
export const useConnectedAddress = () => {
  const { address: authAddress, authMethod, isAuthenticated } = useAuth();
  const { address: wagmiAddress, isConnected: wagmiConnected, isConnecting } = useAccount();

  // Prioritize Farcaster address, fall back to wagmi
  const address = authAddress || wagmiAddress;
  const isConnected = isAuthenticated || wagmiConnected;

  return {
    address,
    isConnected,
    isConnecting,
    authMethod,
  };
};
