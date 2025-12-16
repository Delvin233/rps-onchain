"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFarcaster } from "./FarcasterContext";
import sdk from "@farcaster/miniapp-sdk";
import { useAppKitAccount } from "@reown/appkit/react";
import { useConnectionPersistence } from "~~/hooks/useConnectionPersistence";
import { useSafeAccount } from "~~/hooks/useSafeAccount";

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
  const { address: walletAddress, isConnected: walletConnected } = useSafeAccount();
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount();

  // Use connection persistence hook to help with tab switching
  useConnectionPersistence();

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

  // Track if we're still initializing Farcaster context
  const isInitializing = useMemo(
    () => !mounted || (isMiniAppReady && !!farcasterContext && !farcasterUser),
    [mounted, isMiniAppReady, farcasterContext, farcasterUser],
  );

  // Priority: Farcaster user takes precedence (for miniapp), then wallet
  // Only use Farcaster if we have both user AND address to prevent flashing
  // Memoize to prevent recalculation on every render
  const hasFarcasterAuth = useMemo(() => !!farcasterUser && !!farcasterAddress, [farcasterUser, farcasterAddress]);

  // Merge wallet states - prioritize wagmi since social logins are disabled
  const effectiveWalletConnected = walletConnected || appKitConnected;
  const effectiveWalletAddress = walletAddress || appKitAddress;

  // When in Farcaster context, ignore wallet connections to prevent conflicts
  // This prevents MetaMask from interfering when using Farcaster auth
  const authMethod: AuthMethod = useMemo(
    () => (hasFarcasterAuth ? "farcaster" : effectiveWalletConnected ? "wallet" : null),
    [hasFarcasterAuth, effectiveWalletConnected],
  );

  const isAuthenticated = useMemo(
    () => hasFarcasterAuth || effectiveWalletConnected,
    [hasFarcasterAuth, effectiveWalletConnected],
  );

  const isFarcasterConnected = hasFarcasterAuth;

  // Use Farcaster address if fully authenticated, otherwise use wallet address
  const address = useMemo(
    () => (hasFarcasterAuth ? farcasterAddress : effectiveWalletAddress),
    [hasFarcasterAuth, farcasterAddress, effectiveWalletAddress],
  );

  // Handle tab switching and connection persistence
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocus = () => {
      // When tab regains focus, check if we need to refresh connection state
      if (mounted && !effectiveWalletConnected && !hasFarcasterAuth) {
        // Small delay to let AppKit/wagmi reconnect
        setTimeout(() => {
          // This will trigger a re-render and potentially restore connection
          setMounted(prev => !prev);
          setTimeout(() => setMounted(prev => !prev), 50);
        }, 200);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [mounted, effectiveWalletConnected, hasFarcasterAuth]);

  // Debug log (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[AuthContext] State:", {
        wagmi: { address: walletAddress, connected: walletConnected },
        appKit: { address: appKitAddress, connected: appKitConnected },
        effective: { address: effectiveWalletAddress, connected: effectiveWalletConnected },
        farcaster: { address: farcasterAddress, auth: hasFarcasterAuth },
        final: { authMethod, address },
      });
    }
  }, [
    walletAddress,
    walletConnected,
    appKitAddress,
    appKitConnected,
    effectiveWalletAddress,
    effectiveWalletConnected,
    farcasterAddress,
    hasFarcasterAuth,
    authMethod,
    address,
  ]);

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

        // Dispatch custom event to notify components of address change
        window.dispatchEvent(new Event("addressChanged"));
      }
    }
  }, [mounted, address, stableAddress]);

  // Debug logging
  // Removed debug logging for production

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
        isLoading: isLoading || isInitializing,
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
