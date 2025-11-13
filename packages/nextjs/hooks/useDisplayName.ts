"use client";

import { useBasename } from "./useBasename";
import { useEnsName } from "wagmi";
import { base, mainnet } from "wagmi/chains";

export const useDisplayName = (address: string | undefined) => {
  const { data: mainnetEns } = useEnsName({ address, chainId: mainnet.id });
  const { basename } = useBasename(address);
  const { data: baseEns } = useEnsName({ address, chainId: base.id });

  const displayName =
    mainnetEns || basename || baseEns || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");
  const hasEns = !!(mainnetEns || basename || baseEns);
  const ensType = mainnetEns ? "mainnet" : basename ? "basename" : baseEns ? "base" : null;

  return { displayName, hasEns, ensType, fullAddress: address };
};
