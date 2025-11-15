"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";

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
  
  // Farcaster state
  const [isFarcasterReady, setIsFarcasterReady] = useState(false);
  const [farcasterContext, setFarcasterContext] = useState<any>(null);
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  
  // Verification state
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Farcaster SDK
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        const context = await sdk.context;
        if (context) {
          setFarcasterContext(context);
          setFarcasterUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          });
        }
        await sdk.actions.ready();
        setIsFarcasterReady(true);
      } catch (err) {
        console.error("Farcaster SDK init error:", err);
        setIsFarcasterReady(false);
      }
    };
    initFarcaster();
  }, []);

  // Check verification status
  useEffect(() => {
    setMounted(true);
    const checkAddress = walletAddress || farcasterContext?.connectedAddress;
    
    if (checkAddress && mounted) {
      fetch(`/api/check-verification?address=${checkAddress}`)
        .then(res => res.json())
        .then(data => setIsHumanVerified(data.verified || false))
        .catch(() => setIsHumanVerified(false));
    }
  }, [walletAddress, farcasterContext, mounted]);

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

  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{
          isAuthenticated: false,
          address: null,
          authMethod: null,
          isFarcasterReady: false,
          farcasterUser: null,
          isFarcasterConnected: false,
          connectFarcaster: async () => {},
          isHumanVerified: false,
          verifySelf: async () => {},
          isLoading: false,
          error: null,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  const address = walletAddress || farcasterContext?.connectedAddress || null;
  const authMethod: AuthMethod = walletConnected ? "wallet" : farcasterUser ? "farcaster" : null;
  const isAuthenticated = walletConnected || !!farcasterUser;
  const isFarcasterConnected = !!farcasterUser;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        address,
        authMethod,
        isFarcasterReady,
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
  const { isAuthenticated, address, authMethod } = useAuth();
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
