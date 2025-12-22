"use client";

import { ReactNode, useEffect } from "react";
import { createAppKit } from "@reown/appkit/react";
import scaffoldConfig from "~~/scaffold.config";
import { wagmiAdapter } from "~~/services/web3/appkitConfig";

const projectId = scaffoldConfig.walletConnectProjectId;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Track if AppKit has been initialized to prevent multiple calls
let appKitInitialized = false;

export function Web3Provider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only initialize AppKit on the client side and only once
    if (typeof window !== "undefined" && !appKitInitialized) {
      appKitInitialized = true;

      // Set up metadata with smart URL detection
      // For wallet authorization to work, we need a consistent URL
      // Priority: NEXT_PUBLIC_URL env var > production domain > current origin (for local dev)
      const getMetadataUrl = () => {
        if (process.env.NEXT_PUBLIC_URL) {
          return process.env.NEXT_PUBLIC_URL;
        }
        // Use production URL for Vercel preview deployments to maintain wallet authorization
        if (window.location.hostname.includes("vercel.app")) {
          return "https://rpsonchain.xyz";
        }
        // For local development, use current origin
        return window.location.origin;
      };

      const metadataUrl = getMetadataUrl();
      const metadata = {
        name: "RPS-onChain",
        description: "Rock Paper Scissors on-chain game with AI single player mode and PVP mode",
        url: metadataUrl,
        icons: [`${metadataUrl}/rpsOnchainLogo.png`],
      };

      // Create the modal - following official AppKit + Wagmi docs pattern
      // Now safely called only on client side
      createAppKit({
        adapters: [wagmiAdapter],
        projectId,
        networks: scaffoldConfig.targetNetworks as any,
        defaultNetwork: scaffoldConfig.targetNetworks[0] as any,
        metadata,
        features: {
          analytics: true, // Optional - defaults to your Cloud configuration
          email: false, // Disable email login
          socials: [], // Disable all social logins
        },
        themeMode: "dark",
        themeVariables: {
          "--w3m-accent": "#10b981",
          "--w3m-color-mix": "#10b981",
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
    }
  }, []);

  return <>{children}</>;
}
