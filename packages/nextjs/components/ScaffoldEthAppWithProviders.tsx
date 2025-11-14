"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { AuthProvider } from "~~/contexts/AuthContext";
import { FarcasterProvider } from "~~/contexts/FarcasterContext";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();

  return (
    <>
      <main className="relative flex flex-col min-h-screen">{children}</main>
      <Toaster />
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
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={
            mounted
              ? isDarkMode
                ? darkTheme({
                    accentColor: "#34d399",
                    accentColorForeground: "#0c0a09",
                    borderRadius: "large",
                    overlayBlur: "small",
                  })
                : lightTheme({
                    accentColor: "#93bbfb",
                    accentColorForeground: "#212638",
                    borderRadius: "large",
                    overlayBlur: "small",
                  })
              : lightTheme()
          }
        >
          <FarcasterProvider>
            <AuthProvider>
              <ProgressBar height="3px" color="#2299dd" />
              <ScaffoldEthApp>{children}</ScaffoldEthApp>
            </AuthProvider>
          </FarcasterProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
