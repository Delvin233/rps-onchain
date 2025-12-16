"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { Web3Provider } from "~~/components/Web3Provider";
import { FarcasterProvider } from "~~/contexts/FarcasterContext";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useAppKitThemeSync } from "~~/hooks/useAppKitThemeSync";
import { wagmiConfig } from "~~/services/web3/appkitConfig";

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

export const ScaffoldEthAppWithProviders = ({
  children,
  cookies,
}: {
  children: React.ReactNode;
  cookies?: string | null;
}) => {
  useEffect(() => {
    // Expose queryClient globally for cache invalidation
    if (typeof window !== "undefined") {
      (window as any).__queryClient = queryClient;
    }
  }, []);

  // Use cookieToInitialState for proper SSR support with AppKit
  const initialState = cookieToInitialState(wagmiConfig, cookies);

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
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
