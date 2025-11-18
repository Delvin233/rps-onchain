import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { rainbowkitBurnerWallet } from "burner-connector";
import * as chains from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";

const { onlyLocalBurnerWallet, targetNetworks } = scaffoldConfig;

// Mobile-optimized wallet order
const mobileWallets = [metaMaskWallet, coinbaseWallet, walletConnectWallet, rainbowWallet];

/**
 * wagmi connectors for the wagmi context
 */
export const wagmiConnectors = () => {
  // Only create connectors on client-side to avoid SSR issues
  if (typeof window === "undefined") {
    return [];
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return connectorsForWallets(
    [
      {
        groupName: "Popular",
        wallets: isMobile ? mobileWallets : [metaMaskWallet, coinbaseWallet, walletConnectWallet],
      },
      {
        groupName: "More",
        wallets: isMobile ? [] : [rainbowWallet, safeWallet, ledgerWallet],
      },
      ...(!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet
        ? [
            {
              groupName: "Development",
              wallets: [rainbowkitBurnerWallet],
            },
          ]
        : []),
    ],
    {
      appName: "RPS-OnChain",
      projectId: scaffoldConfig.walletConnectProjectId,
    },
  );
};
