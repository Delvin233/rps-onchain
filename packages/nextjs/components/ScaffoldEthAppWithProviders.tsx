"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Web3Provider } from "~~/components/Web3Provider";
import { FarcasterProvider } from "~~/contexts/FarcasterContext";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useAppKitThemeSync } from "~~/hooks/useAppKitThemeSync";
import { appkitWagmiConfig } from "~~/services/web3/appkitConfig";
import { farcasterWagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();
  useAppKitThemeSync(); // Sync AppKit theme with app theme

  return (
    <>
      <main className="relative flex flex-col min-h-screen">{children}</main>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--theme-card)",
            color: "var(--theme-text)",
            border: "1px solid var(--theme-border)",
            borderRadius: "0.75rem",
            padding: "16px",
            fontSize: "0.9375rem",
            maxWidth: "500px",
            cursor: "pointer",
          },
          success: {
            iconTheme: {
              primary: "var(--theme-success)",
              secondary: "var(--theme-card)",
            },
            style: {
              border: "1px solid var(--theme-success)",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--theme-error)",
              secondary: "var(--theme-card)",
            },
            style: {
              border: "1px solid var(--theme-error)",
            },
          },
        }}
      />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Detect Farcaster synchronously to avoid config switching flash
const detectFarcaster = () => {
  if (typeof window === "undefined") return false;

  // Check for Farcaster iframe context
  const isInIframe = window.self !== window.top;
  const isFarcasterOrigin =
    window.location.ancestorOrigins?.[0]?.includes("farcaster.xyz") ||
    window.location.ancestorOrigins?.[0]?.includes("warpcast.com");

  return isInIframe && isFarcasterOrigin;
};

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  // Detect Farcaster immediately to avoid config switching
  const isFarcasterMiniApp = detectFarcaster();

  useEffect(() => {
    setMounted(true);
    // Expose queryClient globally for cache invalidation
    if (typeof window !== "undefined") {
      (window as any).__queryClient = queryClient;
      console.log("[Wagmi] Farcaster miniapp detected:", isFarcasterMiniApp);
    }
  }, [isFarcasterMiniApp]);

  // Use Farcaster-specific config if in miniapp, otherwise use AppKit config
  const wagmiConfig = isFarcasterMiniApp ? farcasterWagmiConfig : appkitWagmiConfig;

  // Prevent hydration mismatch on mobile
  if (!mounted) {
    return (
      <WagmiProvider config={appkitWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Web3Provider>
            <FarcasterProvider>
              <ProgressBar height="3px" color="#2299dd" />
              <ScaffoldEthApp>{children}</ScaffoldEthApp>
            </FarcasterProvider>
          </Web3Provider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <FarcasterProvider>
            <ProgressBar height="3px" color="#2299dd" />
            <ScaffoldEthApp>{children}</ScaffoldEthApp>
          </FarcasterProvider>
        </Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
