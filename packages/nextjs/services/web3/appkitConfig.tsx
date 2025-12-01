import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks, walletConnectProjectId } = scaffoldConfig;

// Standard wallet connectors
const getWagmiConnectors = () => {
  const connectors = [];

  // Check if we're in an iframe (miniapp context like Base app or Farcaster)
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

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

  // Coinbase Wallet
  connectors.push(
    coinbaseWallet({
      appName: "RPS-onChain",
      appLogoUrl: "https://www.rpsonchain.xyz/rpsOnchainLogo.png",
    }),
  );

  return connectors;
};

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Direct wagmi config like RainbowKit - Farcaster connector FIRST
export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: [farcasterMiniApp(), ...getWagmiConnectors()],
  ssr: true,
  multiInjectedProviderDiscovery: true,
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

// Keep this export for compatibility
export const appkitWagmiConfig = wagmiConfig;

// Create WagmiAdapter for AppKit with our custom config
// This allows AppKit to work with our Farcaster connector
export const wagmiAdapter = new WagmiAdapter({
  networks: enabledChains as any,
  projectId: walletConnectProjectId,
});
