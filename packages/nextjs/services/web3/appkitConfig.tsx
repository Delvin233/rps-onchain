import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
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

// Export wagmi config with Farcaster connector added
export const appkitWagmiConfig = {
  ...wagmiAdapter.wagmiConfig,
  connectors: [...(wagmiAdapter.wagmiConfig.connectors || []), farcasterMiniApp()],
} as any;

// Create the modal (only on client side)
if (typeof window !== "undefined") {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: enabledChains as any,
    defaultNetwork: enabledChains[0] as any,
    metadata,
    features: {
      analytics: true,
    },
  });
}
