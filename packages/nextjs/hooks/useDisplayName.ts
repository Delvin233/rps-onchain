"use client";

import { useEffect, useState } from "react";
import { useBasename } from "./useBasename";
import { useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

export const useDisplayName = (address: string | undefined) => {
  const { data: mainnetEns } = useEnsName({ address, chainId: mainnet.id });
  const { basename } = useBasename(address);
  const [farcasterData, setFarcasterData] = useState<{ name: string | null; pfp: string | null }>({
    name: null,
    pfp: null,
  });

  useEffect(() => {
    if (!address) return;
    fetch(`/api/resolve-name?address=${address}`)
      .then(res => res.json())
      .then(data => {
        if (data.name) setFarcasterData({ name: data.name, pfp: data.pfp || null });
      })
      .catch(() => {});
  }, [address]);

  const displayName =
    mainnetEns || basename || farcasterData.name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");
  const hasEns = !!(mainnetEns || basename || farcasterData.name);
  const ensType = mainnetEns ? "mainnet" : basename ? "basename" : farcasterData.name ? "farcaster" : null;

  return { displayName, hasEns, ensType, fullAddress: address, pfpUrl: farcasterData.pfp };
};
