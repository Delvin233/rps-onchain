"use client";

import { useBasename } from "./useBasename";
import { useQuery } from "@tanstack/react-query";
import { useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

export const useDisplayName = (address: string | undefined) => {
  const { data: mainnetEns } = useEnsName({ address, chainId: mainnet.id });
  const { basename } = useBasename(address);

  const { data: farcasterData } = useQuery({
    queryKey: ["resolve-name", address],
    queryFn: async () => {
      if (!address) return { name: null, pfp: null };
      const res = await fetch(`/api/resolve-name?address=${address}`);
      const data = await res.json();
      return { name: data.name || null, pfp: data.pfp || null };
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Priority: mainnet ENS > basename > farcaster > wallet
  const displayName =
    mainnetEns || basename || farcasterData?.name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");
  const hasEns = !!(mainnetEns || basename || farcasterData?.name);
  const ensType = mainnetEns ? "mainnet" : basename ? "basename" : farcasterData?.name ? "farcaster" : null;
  const pfpUrl = basename ? null : farcasterData?.pfp; // Only show Farcaster pfp if no basename

  return { displayName, hasEns, ensType, fullAddress: address, pfpUrl };
};
