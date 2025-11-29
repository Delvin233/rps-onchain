import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { Chain, http } from "viem";
import { mainnet } from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Get projectId from scaffold config
const projectId = scaffoldConfig.walletConnectProjectId;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Metadata for the app
const metadata = {
  name: "RPS-onChain",
  description: "Rock Paper Scissors on-chain game with AI single player mode and PVP mode",
  url: typeof window !== "undefined" ? window.location.origin : "https://www.rpsonchain.xyz",
  icons: ["https://www.rpsonchain.xyz/rpsOnchainLogo.png"],
};

// Set up the Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks: enabledChains as any,
  transports: Object.fromEntries(
    enabledChains.map(chain => {
      const rpcOverrideUrl = scaffoldConfig.rpcOverrides?.[chain.id as keyof typeof scaffoldConfig.rpcOverrides];
      return [chain.id, http(rpcOverrideUrl)];
    }),
  ) as any,
});

// Use wagmi config directly from adapter - AppKit manages this
export const appkitWagmiConfig = wagmiAdapter.wagmiConfig;

// Create the modal (only on client side)
if (typeof window !== "undefined") {
  // Get theme colors from CSS variables
  const rootStyles = getComputedStyle(document.documentElement);
  const primaryColor = rootStyles.getPropertyValue("--color-primary").trim() || "#10b981";

  const appkit = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: enabledChains as any,
    defaultNetwork: enabledChains[0] as any,
    metadata,
    features: {
      analytics: true,
      swaps: true,
      onramp: true,
    },
    // Theme customization to match your app
    themeMode: "dark",
    themeVariables: {
      "--w3m-color-mix": primaryColor,
      "--w3m-accent": primaryColor,
      "--w3m-border-radius-master": "12px",
    },
    // Featured wallets for better UX
    featuredWalletIds: [
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
      "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
    ],
    // Enable wallet guide for new users
    enableWalletGuide: true,
    // Enable mobile fullscreen for better PWA experience
    enableMobileFullScreen: true,
    // Allow unsupported chains for flexibility
    allowUnsupportedChain: false,
  });

  // Expose theme instance for dynamic updates
  (window as any).__appkit_theme__ = appkit;
}
