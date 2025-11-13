"use client";

import { useEnsName } from "wagmi";
import { base, mainnet } from "wagmi/chains";

export const useDisplayName = (address: string | undefined) => {
  const { data: mainnetEns } = useEnsName({ address, chainId: mainnet.id });
  const { data: baseEns } = useEnsName({ address, chainId: base.id });

  const displayName = mainnetEns || baseEns || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");
  const hasEns = !!(mainnetEns || baseEns);
  const ensType = mainnetEns ? "mainnet" : baseEns ? "base" : null;

  return { displayName, hasEns, ensType };
};
