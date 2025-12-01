"use client";

import { ReactNode, useEffect } from "react";
import { createAppKit } from "@reown/appkit/react";
import scaffoldConfig from "~~/scaffold.config";
import { enabledChains, wagmiAdapter } from "~~/services/web3/appkitConfig";

const projectId = scaffoldConfig.walletConnectProjectId;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

const metadata = {
  name: "RPS-onChain",
  description: "Rock Paper Scissors on-chain game with AI single player mode and PVP mode",
  url: typeof window !== "undefined" ? window.location.origin : "https://www.rpsonchain.xyz",
  icons: ["https://www.rpsonchain.xyz/rpsOnchainLogo.png"],
};

let appKitInitialized = false;

export function Web3Provider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize AppKit only once on client side
    if (!appKitInitialized && typeof window !== "undefined") {
      const rootStyles = getComputedStyle(document.documentElement);
      const primaryColor = rootStyles.getPropertyValue("--color-primary").trim() || "#10b981";

      createAppKit({
        adapters: [wagmiAdapter],
        projectId,
        networks: enabledChains as any,
        defaultNetwork: enabledChains[0] as any,
        metadata,
        features: {
          analytics: true,
          swaps: true,
          onramp: true,
          email: true,
          socials: ["google", "x", "discord", "farcaster"],
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
    }
  }, []);

  return <>{children}</>;
}
