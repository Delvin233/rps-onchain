import { redis } from "./upstash";
import { createPublicClient, http } from "viem";
import { base, mainnet } from "viem/chains";

interface ResolvedName {
  address: string;
  displayName: string;
  source: "farcaster" | "ens" | "basename" | "wallet";
  farcasterUsername?: string;
  farcasterDisplayName?: string;
  ensName?: string;
  basename?: string;
}

// Cache TTL: 1 hour for names (they don't change often)
const NAME_CACHE_TTL = 3600;

export async function resolvePlayerName(address: string): Promise<ResolvedName> {
  if (!address) {
    return {
      address,
      displayName: "Unknown",
      source: "wallet",
    };
  }

  const lowerAddress = address.toLowerCase();

  // Check cache first
  try {
    const cached = await redis.get(`resolvedName:${lowerAddress}`);
    if (cached && typeof cached === "object") {
      return cached as ResolvedName;
    }
  } catch (error) {
    console.error("Error reading name cache:", error);
  }

  // Resolve names from various sources
  const resolved = await resolveFromSources(address);

  // Cache the result
  try {
    await redis.setex(`resolvedName:${lowerAddress}`, NAME_CACHE_TTL, JSON.stringify(resolved));
  } catch (error) {
    console.error("Error caching resolved name:", error);
  }

  return resolved;
}

async function resolveFromSources(address: string): Promise<ResolvedName> {
  const lowerAddress = address.toLowerCase();

  // 1. Check for Farcaster name (highest priority)
  const farcasterName = await resolveFarcasterName(lowerAddress);
  if (farcasterName) {
    return {
      address,
      displayName: farcasterName.displayName || farcasterName.username || `@${farcasterName.fid}`,
      source: "farcaster",
      farcasterUsername: farcasterName.username,
      farcasterDisplayName: farcasterName.displayName,
    };
  }

  // 2. Check for ENS name
  const ensName = await resolveENSName(address);
  if (ensName) {
    return {
      address,
      displayName: ensName,
      source: "ens",
      ensName,
    };
  }

  // 3. Check for Basename
  const basename = await resolveBasename(address);
  if (basename) {
    return {
      address,
      displayName: basename,
      source: "basename",
      basename,
    };
  }

  // 4. Fallback to shortened address
  return {
    address,
    displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
    source: "wallet",
  };
}

async function resolveFarcasterName(
  address: string,
): Promise<{ fid?: number; username?: string; displayName?: string } | null> {
  try {
    // Check if we have cached Farcaster data
    const farcasterData = await redis.get(`farcaster:${address}`);
    if (farcasterData && typeof farcasterData === "object") {
      return farcasterData as { fid?: number; username?: string; displayName?: string };
    }

    // TODO: Integrate with Farcaster API to resolve address to username/displayName
    // For now, return null - this would require Farcaster Hub API integration
    return null;
  } catch (error) {
    console.error("Error resolving Farcaster name:", error);
    return null;
  }
}

async function resolveENSName(address: string): Promise<string | null> {
  try {
    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    const ensName = await mainnetClient.getEnsName({
      address: address as `0x${string}`,
    });

    return ensName;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    return null;
  }
}

async function resolveBasename(address: string): Promise<string | null> {
  try {
    const baseClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const basename = await baseClient.getEnsName({
      address: address as `0x${string}`,
    });

    return basename;
  } catch (error) {
    console.error("Error resolving Basename:", error);
    return null;
  }
}

// Batch resolve multiple addresses
export async function resolvePlayerNames(addresses: string[]): Promise<Record<string, ResolvedName>> {
  const results: Record<string, ResolvedName> = {};

  // Resolve all addresses in parallel
  const promises = addresses.map(async address => {
    const resolved = await resolvePlayerName(address);
    results[address.toLowerCase()] = resolved;
  });

  await Promise.all(promises);
  return results;
}

// Store Farcaster user data when available (called from auth context)
export async function cacheFarcasterUser(
  address: string,
  farcasterData: { fid: number; username?: string; displayName?: string },
) {
  try {
    const lowerAddress = address.toLowerCase();
    await redis.setex(`farcaster:${lowerAddress}`, NAME_CACHE_TTL, JSON.stringify(farcasterData));

    // Also update the resolved name cache
    const resolved: ResolvedName = {
      address,
      displayName: farcasterData.displayName || farcasterData.username || `@${farcasterData.fid}`,
      source: "farcaster",
      farcasterUsername: farcasterData.username,
      farcasterDisplayName: farcasterData.displayName,
    };

    await redis.setex(`resolvedName:${lowerAddress}`, NAME_CACHE_TTL, JSON.stringify(resolved));
  } catch (error) {
    // Only log as warning since caching is optional
    console.warn("Caching unavailable (KV not configured):", error instanceof Error ? error.message : String(error));
  }
}
