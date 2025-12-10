import { useEffect, useState } from "react";
import { blo } from "blo";
import { normalize } from "viem/ens";
import { useEnsAvatar, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { useAuth } from "~~/contexts/AuthContext";

export const useUserAvatar = () => {
  const { farcasterUser, address } = useAuth();
  const [basename, setBasename] = useState<string | null>(null);

  // ENS resolution
  const { data: ensName } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: mainnet.id,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  // Basename resolution
  useEffect(() => {
    if (address) {
      fetch(`/api/resolve-name?address=${address}`)
        .then(res => res.json())
        .then(data => setBasename(data.basename || null))
        .catch(() => setBasename(null));
    }
  }, [address]);

  // Priority order: Farcaster > ENS/Basename > Wallet

  // 1. Farcaster (when in miniapp)
  if (farcasterUser?.pfpUrl) {
    return {
      avatarUrl: farcasterUser.pfpUrl,
      displayName: farcasterUser.displayName || farcasterUser.username || `@${farcasterUser.fid}`,
      source: "farcaster" as const,
    };
  }

  // 2. ENS (with avatar)
  if (ensName && ensAvatar) {
    return {
      avatarUrl: ensAvatar,
      displayName: ensName,
      source: "ens" as const,
    };
  }

  // 3. ENS (name only) or Basename
  if (ensName || basename) {
    return {
      avatarUrl: address ? blo(address as `0x${string}`) : null,
      displayName: ensName || basename || `${address?.slice(0, 6)}...${address?.slice(-4)}`,
      source: ensName ? ("ens" as const) : ("basename" as const),
    };
  }

  // 4. Wallet address
  if (address) {
    return {
      avatarUrl: blo(address as `0x${string}`),
      displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      source: "wallet" as const,
    };
  }

  // Not connected - return null values
  return {
    avatarUrl: null,
    displayName: null,
    source: null,
  };
};
