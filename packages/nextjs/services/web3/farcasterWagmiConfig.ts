import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { createConfig, http } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

const { targetNetworks } = scaffoldConfig;

// Direct wagmi config for Farcaster - bypasses AppKit completely
// This matches how RainbowKit worked - direct connector access
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
