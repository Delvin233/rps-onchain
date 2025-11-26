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
  const isBaseApp = window.ethereum?.isBaseApp || window.location.href.includes("base.dev/preview");

  // In Base app (including preview), return empty array - farcasterMiniApp connector handles everything
  if (isBaseApp) {
    return [];
  }

  const walletGroups = [
    {
      groupName: "Popular",
      wallets: isMobile ? mobileWallets : [metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
  ];

  // Only add More group on desktop
  if (!isMobile) {
    walletGroups.push({
      groupName: "More",
      wallets: [rainbowWallet, safeWallet, ledgerWallet],
    });
  }

  // Add development wallets if needed
  if (!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet) {
    walletGroups.push({
      groupName: "Development",
      wallets: [rainbowkitBurnerWallet],
    });
  }

  return connectorsForWallets(walletGroups, {
    appName: "RPS-onChain",
    projectId: scaffoldConfig.walletConnectProjectId,
  });
};
