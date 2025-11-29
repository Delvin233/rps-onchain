"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { FarcasterProvider } from "~~/contexts/FarcasterContext";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useAppKitThemeSync } from "~~/hooks/useAppKitThemeSync";
import { appkitWagmiConfig } from "~~/services/web3/appkitConfig";

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

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch on mobile
  if (!mounted) {
    return (
      <WagmiProvider config={appkitWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <FarcasterProvider>
            <ProgressBar height="3px" color="#2299dd" />
            <ScaffoldEthApp>{children}</ScaffoldEthApp>
          </FarcasterProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <WagmiProvider config={appkitWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          <ProgressBar height="3px" color="#2299dd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
