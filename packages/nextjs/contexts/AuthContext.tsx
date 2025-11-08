"use client";

import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  isHumanVerified: boolean;
  connectWallet: () => void;
  verifySelf: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (walletAddress && mounted && typeof window !== 'undefined') {
      fetch(`/api/check-verification?address=${walletAddress}`)
        .then(res => res.json())
        .then(data => setIsHumanVerified(data.verified || false))
        .catch(() => setIsHumanVerified(false));
    }
  }, [walletAddress, mounted]);

  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{
          isAuthenticated: false,
          address: null,
          isHumanVerified: false,
          connectWallet: () => {},
          verifySelf: async () => {},
          disconnect: () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  const connectWallet = () => {
    // This will be handled by RainbowKit's ConnectButton
  };

  const verifySelf = async () => {
    // Verification handled in profile page
  };

  const disconnect = () => {
    // Handled by wallet disconnect
  };

  const isAuthenticated = walletConnected;
  const address = walletAddress || null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        address,
        isHumanVerified,
        connectWallet,
        verifySelf,
        disconnect,
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
