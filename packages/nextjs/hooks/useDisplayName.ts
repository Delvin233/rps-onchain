"use client";

import { useBasename } from "./useBasename";
import { useQuery } from "@tanstack/react-query";
import { useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

export const useDisplayName = (address: string | undefined) => {
  const { data: mainnetEns } = useEnsName({ address, chainId: mainnet.id });
  const { basename } = useBasename(address);

  // Platform detection for cache isolation
  const platform =
    typeof window !== "undefined"
      ? window.location.ancestorOrigins?.[0]?.includes("base.dev") || window.location.href.includes("base.dev/preview")
        ? "base"
        : (window as any).ethereum?.isMiniPay
          ? "minipay"
          : "web"
      : "web";

  const { data: farcasterData } = useQuery({
    queryKey: ["resolve-name", address, platform],
    queryFn: async () => {
      if (!address) return { name: null, pfp: null };
      const res = await fetch(`/api/resolve-name?address=${address}`);
      const data = await res.json();
      return { name: data.name || null, pfp: data.pfp || null };
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced from 5)
    gcTime: 2 * 60 * 1000, // 2 minutes (reduced from 10)
  });

  // Priority: mainnet ENS > basename > farcaster > wallet
  const displayName =
    mainnetEns || basename || farcasterData?.name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");
  const hasEns = !!(mainnetEns || basename || farcasterData?.name);
  const ensType = mainnetEns ? "mainnet" : basename ? "basename" : farcasterData?.name ? "farcaster" : null;
  const pfpUrl = basename ? null : farcasterData?.pfp; // Only show Farcaster pfp if no basename

  return { displayName, hasEns, ensType, fullAddress: address, pfpUrl };
};
