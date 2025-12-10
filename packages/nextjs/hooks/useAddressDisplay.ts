import { useEffect, useState } from "react";
import { blo } from "blo";
import { normalize } from "viem/ens";
import { useEnsAvatar, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

/**
 * Hook to display any address (not just the current user)
 * Useful for showing opponent info, match history, leaderboards, etc.
 */
export const useAddressDisplay = (address: string | null | undefined) => {
  const [basename, setBasename] = useState<string | null>(null);

  const { data: ensName } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: mainnet.id,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  useEffect(() => {
    if (address) {
      fetch(`/api/resolve-name?address=${address}`)
        .then(res => res.json())
        .then(data => setBasename(data.basename || null))
        .catch(() => setBasename(null));
    }
  }, [address]);

  if (!address) {
    return {
      avatarUrl: null,
      displayName: "Unknown",
      source: null,
    };
  }

  // ENS with avatar
  if (ensName && ensAvatar) {
    return {
      avatarUrl: ensAvatar,
      displayName: ensName,
      source: "ens" as const,
    };
  }

  // ENS or Basename (name only)
  if (ensName || basename) {
    return {
      avatarUrl: blo(address as `0x${string}`),
      displayName: ensName || basename || `${address.slice(0, 6)}...${address.slice(-4)}`,
      source: ensName ? ("ens" as const) : ("basename" as const),
    };
  }

  // Plain address
  return {
    avatarUrl: blo(address as `0x${string}`),
    displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
    source: "wallet" as const,
  };
};
