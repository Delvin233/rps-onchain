"use client";

import { ReactNode, createContext, useContext } from "react";
import { useAccount } from "wagmi";
import { useSelfProtocol } from "~~/hooks/useSelfProtocol";

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
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const { isVerified: selfVerified, verify: verifySelfProtocol, disconnect: disconnectSelf } = useSelfProtocol();

  const connectWallet = () => {
    // This will be handled by RainbowKit's ConnectButton
  };

  const verifySelf = async () => {
    await verifySelfProtocol();
  };

  const disconnect = () => {
    if (selfVerified) {
      disconnectSelf();
    }
  };

  const isAuthenticated = walletConnected;
  const address = walletAddress || null;
  const isHumanVerified = selfVerified;

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
