import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "@wagmi/core";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks, walletConnectProjectId } = scaffoldConfig;

// Standard wallet connectors - SSR safe
const getWagmiConnectors = () => {
  // During SSR, return empty array to prevent window access
  if (typeof window === "undefined") {
    return [];
  }

  const connectors = [];

  // Check if we're in an iframe (miniapp context like Base app or Farcaster)
  const isInIframe = window.self !== window.top;

  // Only add injected connector (MetaMask, etc.) if NOT in an iframe
  // This prevents MetaMask from popping up in Base app or Farcaster miniapp
  if (!isInIframe) {
    connectors.push(
      injected({
        shimDisconnect: true,
      }),
    );
  }

  // WalletConnect
  if (walletConnectProjectId) {
    connectors.push(
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: false,
      }),
    );
  }

  // Coinbase Wallet - use dynamic URL for logo
  const getLogoUrl = () => {
    if (typeof window !== "undefined") {
      const baseUrl =
        process.env.NEXT_PUBLIC_URL ||
        (window.location.hostname.includes("vercel.app") ? "https://rpsonchain.xyz" : window.location.origin);
      return `${baseUrl}/rpsOnchainLogo.png`;
    }
    return "https://rpsonchain.xyz/rpsOnchainLogo.png"; // SSR fallback
  };

  connectors.push(
    coinbaseWallet({
      appName: "RPS-onChain",
      appLogoUrl: getLogoUrl(),
    }),
  );

  return connectors;
};

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Create WagmiAdapter for AppKit following official docs pattern
// This replaces our custom wagmi config and integrates with AppKit properly
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: walletConnectProjectId,
  networks: enabledChains as any,
  // Only add connectors on client side to prevent SSR issues
  connectors: typeof window !== "undefined" ? [farcasterMiniApp(), ...getWagmiConnectors()] : [],
  client: ({ chain }) => {
    let rpcFallbacks = [http()];
    const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
    if (rpcOverrideUrl) {
      rpcFallbacks = [http(rpcOverrideUrl), http()];
    } else {
      const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
      if (alchemyHttpUrl) {
        const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
        rpcFallbacks = isUsingDefaultKey ? [http(), http(alchemyHttpUrl)] : [http(alchemyHttpUrl), http()];
      }
    }
    return createClient({
      chain,
      transport: fallback(rpcFallbacks),
      ...(chain.id !== (hardhat as Chain).id ? { pollingInterval: scaffoldConfig.pollingInterval } : {}),
    });
  },
});

// Export the wagmi config from the adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Keep this export for compatibility
export const appkitWagmiConfig = wagmiConfig;
