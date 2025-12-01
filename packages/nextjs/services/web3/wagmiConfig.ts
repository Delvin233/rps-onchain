import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { createConfig, http } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

const { targetNetworks } = scaffoldConfig;

// Create a direct wagmi config with Farcaster connector (bypasses Reown/AppKit)
// This provides proper wallet client for GoodDollar SDK
export const farcasterWagmiConfig = createConfig({
  chains: targetNetworks as any,
  connectors: [farcasterMiniApp()],
  transports: Object.fromEntries(
    targetNetworks.map(chain => {
      const rpcOverrideUrl = scaffoldConfig.rpcOverrides?.[chain.id as keyof typeof scaffoldConfig.rpcOverrides];
      return [chain.id, http(rpcOverrideUrl)];
    }),
  ) as any,
  ssr: false,
});
