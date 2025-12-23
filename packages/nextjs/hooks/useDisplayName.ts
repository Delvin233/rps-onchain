"use client";

import { useBasename } from "./useBasename";
import { useQuery } from "@tanstack/react-query";
import { useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { getBaseUrl } from "~~/utils/shareUtils";

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

  const { data: resolvedName } = useQuery({
    queryKey: ["resolve-name", address, platform],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`${getBaseUrl()}/api/resolve-name?address=${address}`);
      if (!res.ok) return null;
      const data = await res.json();
      console.log(`[useDisplayName] API Response for ${address}:`, data);
      return data;
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Use the comprehensive name resolution system with proper priority:
  // Farcaster > ENS > Basename > wallet address
  let displayName = "";
  let hasEns = false;
  let ensType: string | null = null;
  let pfpUrl: string | null = null;

  if (resolvedName) {
    displayName = resolvedName.displayName;
    hasEns = resolvedName.source !== "wallet";
    ensType = resolvedName.source;
    pfpUrl = resolvedName.pfpUrl || null;

    // Debug logging
    console.log(`[useDisplayName] Final values for ${address}:`, {
      displayName,
      source: resolvedName.source,
      ensType,
      hasEns,
      resolvedName,
    });

    // Additional debugging for UI badge issues
    console.log(`[useDisplayName] Badge check for ${address}:`, {
      hasEns,
      ensType,
      shouldShowBadge: hasEns && ensType !== "wallet",
      badgeText:
        ensType === "ens"
          ? "ENS"
          : ensType === "basename"
            ? "BASENAME"
            : ensType === "farcaster"
              ? "FC"
              : ensType?.toUpperCase(),
    });
  } else {
    // Fallback to old logic if API fails
    displayName = mainnetEns || basename || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");
    hasEns = !!(mainnetEns || basename);
    ensType = mainnetEns ? "ens" : basename ? "basename" : null;

    console.log(`[useDisplayName] Fallback values for ${address}:`, {
      displayName,
      ensType,
      hasEns,
      mainnetEns,
      basename,
    });
  }

  return { displayName, hasEns, ensType, fullAddress: address, pfpUrl };
};
