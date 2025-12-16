"use client";

import { ReactNode, useEffect, useState } from "react";
import { createAppKit } from "@reown/appkit/react";
import scaffoldConfig from "~~/scaffold.config";
import { wagmiAdapter } from "~~/services/web3/appkitConfig";

const projectId = scaffoldConfig.walletConnectProjectId;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

const metadata = {
  name: "RPS-onChain",
  description: "Rock Paper Scissors on-chain game with AI single player mode and PVP mode",
  url: typeof window !== "undefined" ? window.location.origin : "https://www.rpsonchain.xyz",
  icons: ["https://www.rpsonchain.xyz/rpsOnchainLogo.png"],
  // Add verifyUrl to help with authorization
  verifyUrl: typeof window !== "undefined" ? window.location.origin : "https://www.rpsonchain.xyz",
};

let appKitInitialized = false;

export function Web3Provider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only initialize on client side and only once
    if (!isClient || appKitInitialized || typeof window === "undefined") {
      return;
    }

    const initializeAppKit = async () => {
      try {
        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Double-check we're still on client
        if (typeof window === "undefined" || typeof document === "undefined") {
          console.warn("[Web3Provider] Not in browser environment");
          return;
        }

        // Get theme color safely
        let primaryColor = "#10b981";
        try {
          const rootStyles = getComputedStyle(document.documentElement);
          primaryColor = rootStyles.getPropertyValue("--color-primary").trim() || "#10b981";
        } catch {
          console.warn("[Web3Provider] Could not get CSS variables, using default color");
        }

        console.log("[Web3Provider] Initializing AppKit...");

        createAppKit({
          adapters: [wagmiAdapter],
          projectId,
          networks: scaffoldConfig.targetNetworks as any,
          defaultNetwork: scaffoldConfig.targetNetworks[0] as any,
          metadata,
          features: {
            analytics: true,
            swaps: true,
            onramp: true,
            email: false,
            socials: [],
          },
          themeMode: "dark",
          themeVariables: {
            "--w3m-accent": primaryColor,
            "--w3m-color-mix": primaryColor,
            "--w3m-color-mix-strength": 20,
            "--w3m-border-radius-master": "0.75rem",
            "--w3m-z-index": 1000,
          },
          allWallets: "SHOW",
          featuredWalletIds: [
            "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
            "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
            "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
          ],
          enableWalletGuide: true,
          enableMobileFullScreen: true,
          allowUnsupportedChain: false,
        });

        appKitInitialized = true;
        console.log("[Web3Provider] AppKit initialized successfully");

        // Notify other components
        try {
          window.dispatchEvent(new CustomEvent("appkit-ready"));
          (window as any).__appkit_instance = true;
        } catch (error) {
          console.warn("[Web3Provider] Could not dispatch events:", error);
        }
      } catch (error) {
        console.error("[Web3Provider] Failed to initialize AppKit:", error);
        // Don't retry automatically to avoid infinite loops
        appKitInitialized = false;
      }
    };

    // Initialize with a small delay to ensure everything is ready
    const timer = setTimeout(initializeAppKit, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [isClient]);

  // Don't render children until we're on client side
  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}
