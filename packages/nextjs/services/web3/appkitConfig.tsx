import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "viem";
import scaffoldConfig from "~~/scaffold.config";

const { targetNetworks } = scaffoldConfig;

// Use only the configured target networks (Celo and Base)
export const enabledChains = targetNetworks;

// Get projectId from scaffold config
const projectId = scaffoldConfig.walletConnectProjectId;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Set up the Wagmi Adapter with Farcaster connector
export const wagmiAdapter = new WagmiAdapter({
  ssr: false, // Disable SSR to prevent social login timeouts
  projectId,
  networks: enabledChains as any,
  transports: Object.fromEntries(
    enabledChains.map(chain => {
      const rpcOverrideUrl = scaffoldConfig.rpcOverrides?.[chain.id as keyof typeof scaffoldConfig.rpcOverrides];
      return [chain.id, http(rpcOverrideUrl)];
    }),
  ) as any,
  connectors: [farcasterMiniApp()],
});

// Use wagmi config directly from adapter - AppKit manages this
export const appkitWagmiConfig = wagmiAdapter.wagmiConfig;
