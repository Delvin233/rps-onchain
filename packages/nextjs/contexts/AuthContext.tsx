"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFarcaster } from "./FarcasterContext";
import sdk from "@farcaster/miniapp-sdk";
import { useAccount } from "wagmi";

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

  // Use FarcasterContext instead of duplicating SDK initialization
  const { context: farcasterContext, enrichedUser, isMiniAppReady } = useFarcaster();

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

  // Compute values before any conditional returns
  // Prioritize Farcaster auth when in Farcaster context
  const farcasterAddress = (farcasterContext as any)?.connectedAddress;

  // Determine auth method and address with proper priority
  // If we're in a Farcaster miniapp context, ONLY use Farcaster auth
  const authMethod: AuthMethod = isMiniAppReady
    ? farcasterUser
      ? "farcaster"
      : null // In miniapp: only farcaster auth
    : farcasterUser
      ? "farcaster"
      : walletConnected
        ? "wallet"
        : null; // Outside miniapp: farcaster or wallet

  const isAuthenticated = !!farcasterUser || (!isMiniAppReady && walletConnected);
  const isFarcasterConnected = !!farcasterUser;

  // Address priority: Farcaster address if in miniapp, otherwise wallet address
  const address = isMiniAppReady
    ? farcasterAddress // In miniapp: only use Farcaster address
    : farcasterAddress || walletAddress || null; // Outside miniapp: prefer Farcaster, fallback to wallet

  // Check verification status
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAddress = walletAddress || (farcasterContext as any)?.connectedAddress;

    if (checkAddress && mounted) {
      fetch(`/api/check-verification?address=${checkAddress}`)
        .then(res => res.json())
        .then(data => setIsHumanVerified(data.verified || false))
        .catch(() => setIsHumanVerified(false));
    }
  }, [walletAddress, farcasterContext, mounted]);

  // Set current user address globally for theme components and clear caches on address change
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const previousAddress = (window as any).__currentUserAddress;

      // If address changed, clear any cached data
      if (previousAddress && previousAddress !== address) {
        console.log(`[AuthContext] Address changed from ${previousAddress} to ${address}, clearing caches`);

        // Clear React Query cache for the old address
        if ((window as any).__queryClient) {
          (window as any).__queryClient.invalidateQueries();
        }
      }

      (window as any).__currentUserAddress = address;
    }
  }, [mounted, address]);

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
