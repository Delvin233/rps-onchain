"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFarcaster } from "./FarcasterContext";
import sdk from "@farcaster/miniapp-sdk";
import { useAccount, useDisconnect } from "wagmi";

type AuthMethod = "wallet" | "farcaster" | null;

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface AuthContextType {
  // Wallet Auth
  isAuthenticated: boolean;
  address: string | null;
  authMethod: AuthMethod;

  // Farcaster Auth
  isFarcasterReady: boolean;
  farcasterUser: FarcasterUser | null;
  isFarcasterConnected: boolean;
  connectFarcaster: () => Promise<void>;

  // Self Protocol Verification
  isHumanVerified: boolean;
  verifySelf: () => Promise<void>;

  // General
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Use FarcasterContext instead of duplicating SDK initialization
  const { context: farcasterContext, enrichedUser, isMiniAppReady } = useFarcaster();

  // Get Farcaster address early to determine auth priority
  const farcasterAddress = (farcasterContext as any)?.connectedAddress;

  // Map enriched user to farcaster user format - wrapped in useMemo to prevent recreating on every render
  const farcasterUser: FarcasterUser | null = useMemo(
    () =>
      enrichedUser
        ? {
            fid: enrichedUser.fid,
            username: enrichedUser.username,
            displayName: enrichedUser.displayName,
            pfpUrl: enrichedUser.pfpUrl,
          }
        : null,
    [enrichedUser],
  );

  // Verification state
  const [isHumanVerified, setIsHumanVerified] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Priority: Farcaster user takes precedence (for miniapp), then wallet
  // Only use Farcaster if we have both user AND address to prevent flashing
  const hasFarcasterAuth = !!farcasterUser && !!farcasterAddress;

  // When in Farcaster context, ignore wallet connections to prevent conflicts
  // This prevents MetaMask from interfering when using Farcaster auth
  const authMethod: AuthMethod = hasFarcasterAuth ? "farcaster" : walletConnected ? "wallet" : null;
  const isAuthenticated = hasFarcasterAuth || walletConnected;
  const isFarcasterConnected = hasFarcasterAuth;

  // Use Farcaster address if fully authenticated, otherwise use wallet address
  // When Farcaster is active, completely ignore the wallet address
  const address = hasFarcasterAuth ? farcasterAddress : walletAddress;

  // Disconnect wallet when Farcaster auth becomes active to prevent conflicts
  useEffect(() => {
    if (mounted && hasFarcasterAuth && walletConnected) {
      console.log("[AuthContext] Farcaster auth active, disconnecting wallet to prevent conflicts");
      disconnect();
    }
  }, [mounted, hasFarcasterAuth, walletConnected, disconnect]);

  // Clear Farcaster state when wallet connects and we're not in Farcaster context
  // This handles the reverse case: switching from Farcaster tab to MetaMask tab
  useEffect(() => {
    if (mounted && walletConnected && !hasFarcasterAuth && farcasterContext?.user) {
      // If wallet is connected but Farcaster context still has a user (shouldn't happen in real miniapp)
      // This means we're outside the Farcaster environment but state persists
      console.log("[AuthContext] Wallet connected outside Farcaster context, prioritizing wallet");
    }
  }, [mounted, walletConnected, hasFarcasterAuth, farcasterContext]);

  // Check verification status
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Use the computed address from our priority logic
    if (address && mounted) {
      fetch(`/api/check-verification?address=${address}`)
        .then(res => res.json())
        .then(data => setIsHumanVerified(data.verified || false))
        .catch(() => setIsHumanVerified(false));
    }
  }, [address, mounted]);

  // Set current user address globally for theme components and clear caches on address change
  // Use a ref to track the last stable address to prevent rapid switching
  const [stableAddress, setStableAddress] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      // Normalize address to lowercase for comparison
      const normalizedAddress = address?.toLowerCase();
      const normalizedStable = stableAddress?.toLowerCase();

      // Only update if we have a real address and it's different from the stable one (case-insensitive)
      if (normalizedAddress && normalizedAddress !== normalizedStable) {
        const previousAddress = (window as any).__currentUserAddress;
        const normalizedPrevious = previousAddress?.toLowerCase();

        // Only clear cache if address actually changed (case-insensitive) and both are defined
        // This prevents clearing on initial undefined -> address transition or case-only changes
        if (normalizedPrevious && normalizedPrevious !== normalizedAddress && normalizedPrevious !== "undefined") {
          console.log(`[AuthContext] Address changed from ${previousAddress} to ${address}, clearing caches`);

          // Clear React Query cache for the old address
          if ((window as any).__queryClient) {
            (window as any).__queryClient.invalidateQueries();
          }
        }

        (window as any).__currentUserAddress = address;
        setStableAddress(address);
      }
    }
  }, [mounted, address, stableAddress]);

  // Debug logging
  useEffect(() => {
    if (mounted) {
      console.log("[AuthContext] Mounted state:");
      console.log("  - Farcaster user:", farcasterUser);
      console.log("  - Address:", address);
      console.log("  - Auth method:", authMethod);
      console.log("  - Is authenticated:", isAuthenticated);
      console.log("  - Wallet connected:", walletConnected);
    }
  }, [mounted, farcasterUser, address, authMethod, isAuthenticated, walletConnected]);

  const connectFarcaster = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!farcasterContext) {
        throw new Error("Not in Farcaster mini app");
      }

      const { token } = await sdk.quickAuth.getToken();
      if (!token) {
        throw new Error("Farcaster sign in failed");
      }

      const res = await fetch("/api/farcaster/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fid: farcasterContext.user.fid,
        }),
      });

      if (!res.ok) {
        throw new Error("Farcaster auth failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifySelf = async () => {
    // Handled in profile page with Self Protocol
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        address,
        authMethod,
        isFarcasterReady: isMiniAppReady,
        farcasterUser,
        isFarcasterConnected,
        connectFarcaster,
        isHumanVerified,
        verifySelf,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Convenience hooks
export const useWalletAuth = () => {
  const { address, authMethod } = useAuth();
  return {
    isConnected: authMethod === "wallet",
    address: authMethod === "wallet" ? address : null,
  };
};

export const useFarcasterAuth = () => {
  const { isFarcasterReady, farcasterUser, isFarcasterConnected, connectFarcaster, isLoading, error } = useAuth();
  return {
    isReady: isFarcasterReady,
    user: farcasterUser,
    isConnected: isFarcasterConnected,
    connect: connectFarcaster,
    isLoading,
    error,
  };
};

export const useVerification = () => {
  const { isHumanVerified, verifySelf, address } = useAuth();
  return {
    isVerified: isHumanVerified,
    verify: verifySelf,
    address,
  };
};
