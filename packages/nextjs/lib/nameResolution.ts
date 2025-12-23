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
  console.log(`[resolvePlayerName] Starting resolution for: ${address}`);

  // Check cache first
  try {
    const cached = await redis.get(`resolvedName:${lowerAddress}`);
    if (cached && typeof cached === "object") {
      console.log(`[resolvePlayerName] Cache hit for ${lowerAddress}:`, cached);
      return cached as ResolvedName;
    }
    console.log(`[resolvePlayerName] No cache found for ${lowerAddress}`);
  } catch (error) {
    console.error("[resolvePlayerName] Error reading name cache:", error);
  }

  // Resolve names from various sources
  console.log(`[resolvePlayerName] Resolving from sources for: ${address}`);
  const resolved = await resolveFromSources(address);
  console.log(`[resolvePlayerName] Final resolved result:`, resolved);

  // Cache the result
  try {
    await redis.setex(`resolvedName:${lowerAddress}`, NAME_CACHE_TTL, JSON.stringify(resolved));
    console.log(`[resolvePlayerName] Cached result for ${lowerAddress}`);
  } catch (error) {
    console.error("[resolvePlayerName] Error caching resolved name:", error);
  }

  return resolved;
}

async function resolveFromSources(address: string): Promise<ResolvedName> {
  const lowerAddress = address.toLowerCase();
  console.log(`[Name Resolution] Starting resolution for address: ${address}`);

  // 1. Check for Farcaster name (highest priority)
  console.log(`[Name Resolution] Checking Farcaster for: ${address}`);
  const farcasterName = await resolveFarcasterName(lowerAddress);
  if (farcasterName) {
    console.log(`[Name Resolution] Found Farcaster name:`, farcasterName);
    return {
      address,
      displayName: farcasterName.displayName || farcasterName.username || `@${farcasterName.fid}`,
      source: "farcaster",
      farcasterUsername: farcasterName.username,
      farcasterDisplayName: farcasterName.displayName,
    };
  }

  // 2. Check for ENS name
  console.log(`[Name Resolution] Checking ENS for: ${address}`);
  const ensName = await resolveENSName(address);
  if (ensName) {
    console.log(`[Name Resolution] Found ENS name: ${ensName}`);
    return {
      address,
      displayName: ensName,
      source: "ens",
      ensName,
    };
  }

  // 3. Check for Basename
  console.log(`[Name Resolution] Checking Basename for: ${address}`);
  const basename = await resolveBasename(address);
  if (basename) {
    console.log(`[Name Resolution] Found Basename: ${basename}`);
    return {
      address,
      displayName: basename,
      source: "basename",
      basename,
    };
  }

  // 4. Fallback to shortened address
  console.log(`[Name Resolution] No names found, using wallet fallback for: ${address}`);
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
    const lowerAddress = address.toLowerCase();

    // Check if we have cached Farcaster data
    const farcasterData = await redis.get(`farcaster:${lowerAddress}`);
    if (farcasterData && typeof farcasterData === "object") {
      console.log(`[Farcaster Resolution] Cache hit for ${lowerAddress}:`, farcasterData);
      return farcasterData as { fid?: number; username?: string; displayName?: string };
    }

    // Resolve using Neynar API (free tier)
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      console.log("[Farcaster Resolution] NEYNAR_API_KEY not configured, skipping Farcaster resolution");
      return null;
    }

    console.log(`[Farcaster Resolution] Calling Neynar API for address: ${lowerAddress}`);

    try {
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${lowerAddress}`,
        {
          headers: {
            Accept: "application/json",
            api_key: neynarApiKey,
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // Increased timeout to 10 seconds
        },
      );

      if (!response.ok) {
        console.log(`[Farcaster Resolution] Neynar API response not ok: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.log(`[Farcaster Resolution] Error response body:`, errorText);
        return null;
      }

      const data = await response.json();
      console.log(`[Farcaster Resolution] Neynar API response:`, JSON.stringify(data, null, 2));

      // Neynar returns an object with address keys
      const userData = data[lowerAddress];
      if (!userData || userData.length === 0) {
        console.log(`[Farcaster Resolution] No user data found for address: ${lowerAddress}`);
        return null;
      }

      // Take the first user if multiple
      const user = userData[0];
      const farcasterInfo = {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
      };

      console.log(`[Farcaster Resolution] Found user:`, farcasterInfo);

      // Cache the result for future use
      try {
        await redis.setex(`farcaster:${lowerAddress}`, NAME_CACHE_TTL, JSON.stringify(farcasterInfo));
        console.log(`[Farcaster Resolution] Cached result for ${lowerAddress}`);
      } catch (cacheError) {
        console.warn("[Farcaster Resolution] Failed to cache Farcaster data:", cacheError);
      }

      return farcasterInfo;
    } catch (apiError) {
      console.error("[Farcaster Resolution] Error calling Neynar API:", apiError);
      return null;
    }
  } catch (error) {
    console.error("[Farcaster Resolution] Error resolving Farcaster name:", error);
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
    console.log(`[Basename Resolution] Attempting to resolve for address: ${address}`);

    const baseClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Use the same approach as the existing basename API
    // Don't specify universalResolverAddress - let viem handle it
    try {
      const basename = await baseClient.getEnsName({
        address: address as `0x${string}`,
      });

      if (basename) {
        console.log(`[Basename Resolution] Found basename: ${basename}`);
      } else {
        console.log(`[Basename Resolution] No basename found for address: ${address}`);
      }

      return basename;
    } catch (resolverError) {
      // Base might not have ENS support for this address
      console.log(`[Basename Resolution] Base resolver error for ${address}:`, resolverError);
      return null;
    }
  } catch (error) {
    console.error(`[Basename Resolution] Error resolving Basename for ${address}:`, error);
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
