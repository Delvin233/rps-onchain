/**
 * Name Resolution Utility
 *
 * Resolves display names for Ethereum addresses using:
 * 1. Farcaster username (if available from context)
 * 2. ENS name (via ENS resolver)
 * 3. Basename (via Basename resolver)
 * 4. Truncated address (fallback)
 *
 * Includes caching to improve performance.
 */
import { createPublicClient, http } from "viem";
import { base, mainnet } from "viem/chains";

// Simple in-memory cache
interface CacheEntry {
  name: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 300000; // 5 minutes

// Create public clients for ENS and Basename resolution
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * Resolve ENS name for an address
 * @param address - Ethereum address
 * @returns ENS name or null
 */
async function resolveENS(address: string): Promise<string | null> {
  try {
    const ensName = await mainnetClient.getEnsName({
      address: address as `0x${string}`,
    });
    return ensName;
  } catch (error) {
    console.error("[NameResolver] ENS resolution failed:", error);
    return null;
  }
}

/**
 * Resolve Basename for an address
 * @param address - Ethereum address
 * @returns Basename or null
 */
async function resolveBasename(address: string): Promise<string | null> {
  try {
    const basename = await baseClient.getEnsName({
      address: address as `0x${string}`,
    });
    return basename;
  } catch (error) {
    // Suppress expected "ChainDoesNotSupportContract" error for Base chain
    // Base doesn't support ENS resolver, but we still try for compatibility
    if (error instanceof Error && error.message.includes("ChainDoesNotSupportContract")) {
      // This is expected, don't log it
      return null;
    }
    console.error("[NameResolver] Basename resolution failed:", error);
    return null;
  }
}

/**
 * Resolve Farcaster username for an address via Neynar API
 * @param address - Ethereum address
 * @returns Farcaster username or null
 */
async function resolveFarcaster(address: string): Promise<string | null> {
  const apiKey = process.env.NEYNAR_API_KEY;

  // Skip if no API key configured
  if (!apiKey) {
    console.log("[NameResolver] NEYNAR_API_KEY not configured, skipping Farcaster resolution");
    return null;
  }

  try {
    const lowerAddress = address.toLowerCase();

    // Neynar v2 endpoint for bulk address lookup
    // Note: This endpoint returns 404 if NONE of the addresses have Farcaster accounts
    // It returns 200 with empty object {} if addresses exist but have no accounts
    const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${lowerAddress}`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        api_key: apiKey,
      },
    });

    // 404 means the address doesn't have a Farcaster account (this is normal)
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NameResolver] Neynar API returned ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();

    // Neynar bulk-by-address returns: { [address]: [user1, user2, ...] }
    // Try both lowercase and original address as keys
    const users = data[lowerAddress] || data[address];

    if (users && Array.isArray(users) && users.length > 0) {
      const user = users[0];
      return user.username || null;
    }

    return null;
  } catch (error) {
    console.error("[NameResolver] Farcaster resolution failed:", error);
    return null;
  }
}

/**
 * Bulk resolve Farcaster usernames for multiple addresses via Neynar API
 * More efficient than calling resolveFarcaster multiple times
 * @param addresses - Array of Ethereum addresses
 * @returns Map of address to Farcaster username
 */
async function bulkResolveFarcaster(addresses: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const apiKey = process.env.NEYNAR_API_KEY;

  // Skip if no API key configured
  if (!apiKey) {
    console.log("[NameResolver] NEYNAR_API_KEY not configured, skipping Farcaster resolution");
    return results;
  }

  if (addresses.length === 0) {
    return results;
  }

  try {
    // Neynar bulk endpoint accepts up to 350 addresses at once
    // We'll batch in groups of 100 to be safe
    const batchSize = 100;

    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const lowerAddresses = batch.map(a => a.toLowerCase());
      const addressesParam = lowerAddresses.join(",");

      console.log(
        `[NameResolver] Fetching Farcaster names for ${batch.length} addresses (batch ${Math.floor(i / batchSize) + 1})`,
      );

      const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addressesParam}`;

      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          api_key: apiKey,
        },
      });

      // 404 means none of these addresses have Farcaster accounts (this is normal)
      if (response.status === 404) {
        console.log(`[NameResolver] Batch ${Math.floor(i / batchSize) + 1} returned 404 - no Farcaster accounts found`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[NameResolver] Neynar bulk API returned ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();

      // Process results
      for (const address of lowerAddresses) {
        const users = data[address];
        if (users && Array.isArray(users) && users.length > 0) {
          const username = users[0].username;
          if (username) {
            results.set(address, username);
            console.log(`[NameResolver] Found Farcaster name for ${address}: ${username}`);
          }
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  } catch (error) {
    console.error("[NameResolver] Bulk Farcaster resolution failed:", error);
    return results;
  }
}

/**
 * Truncate an Ethereum address for display
 * @param address - Ethereum address
 * @returns Truncated address (0x1234...5678)
 */
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Resolve display name for an address
 * Tries multiple resolution methods in priority order
 * @param address - Ethereum address
 * @param skipCache - Skip cache and force fresh resolution
 * @returns Display name (ENS/Basename/Farcaster/truncated address)
 */
export async function resolveDisplayName(address: string, skipCache: boolean = false): Promise<string> {
  const lowerAddress = address.toLowerCase();
  const now = Date.now();

  // Check cache first (unless skipCache is true)
  if (!skipCache) {
    const cached = cache.get(lowerAddress);

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.name;
    }
  }

  // Try resolution methods in priority order
  try {
    // 1. Try Farcaster (via Neynar API)
    const farcasterName = await resolveFarcaster(lowerAddress);
    if (farcasterName) {
      cache.set(lowerAddress, { name: farcasterName, timestamp: now });
      return farcasterName;
    }

    // 2. Try ENS
    const ensName = await resolveENS(lowerAddress);
    if (ensName) {
      cache.set(lowerAddress, { name: ensName, timestamp: now });
      return ensName;
    }

    // 3. Try Basename
    const basename = await resolveBasename(lowerAddress);
    if (basename) {
      cache.set(lowerAddress, { name: basename, timestamp: now });
      return basename;
    }

    // 4. Fallback to truncated address
    const truncated = truncateAddress(lowerAddress);
    cache.set(lowerAddress, { name: truncated, timestamp: now });
    return truncated;
  } catch (error) {
    console.error("[NameResolver] Resolution failed:", error);
    const truncated = truncateAddress(lowerAddress);
    cache.set(lowerAddress, { name: truncated, timestamp: now });
    return truncated;
  }
}

/**
 * Batch resolve display names for multiple addresses
 * Uses bulk Farcaster API for efficiency
 * @param addresses - Array of Ethereum addresses
 * @param skipCache - Skip cache and force fresh resolution
 * @returns Map of address to display name
 */
export async function batchResolveDisplayNames(
  addresses: string[],
  skipCache: boolean = false,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const now = Date.now();
  const lowerAddresses = addresses.map(a => a.toLowerCase());

  // Step 1: Check cache for all addresses (if not skipping)
  const uncachedAddresses: string[] = [];

  if (!skipCache) {
    for (const address of lowerAddresses) {
      const cached = cache.get(address);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        results.set(address, cached.name);
      } else {
        uncachedAddresses.push(address);
      }
    }
  } else {
    uncachedAddresses.push(...lowerAddresses);
  }

  if (uncachedAddresses.length === 0) {
    console.log("[NameResolver] All addresses found in cache");
    return results;
  }

  console.log(`[NameResolver] Resolving ${uncachedAddresses.length} uncached addresses`);

  // Step 2: Bulk resolve Farcaster names (most efficient)
  const farcasterNames = await bulkResolveFarcaster(uncachedAddresses);

  // Step 3: For addresses without Farcaster names, try ENS/Basename
  const addressesNeedingENS: string[] = [];

  for (const address of uncachedAddresses) {
    const farcasterName = farcasterNames.get(address);
    if (farcasterName) {
      results.set(address, farcasterName);
      cache.set(address, { name: farcasterName, timestamp: now });
    } else {
      addressesNeedingENS.push(address);
    }
  }

  // Step 4: Resolve ENS/Basename for remaining addresses (in parallel batches)
  if (addressesNeedingENS.length > 0) {
    console.log(`[NameResolver] Resolving ENS/Basename for ${addressesNeedingENS.length} addresses`);

    const batchSize = 10;
    for (let i = 0; i < addressesNeedingENS.length; i += batchSize) {
      const batch = addressesNeedingENS.slice(i, i + batchSize);
      const promises = batch.map(async address => {
        // Try ENS
        const ensName = await resolveENS(address);
        if (ensName) return { address, name: ensName };

        // Try Basename
        const basename = await resolveBasename(address);
        if (basename) return { address, name: basename };

        // Fallback to truncated address
        return { address, name: truncateAddress(address) };
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ address, name }) => {
        results.set(address, name);
        cache.set(address, { name, timestamp: now });
      });
    }
  }

  return results;
}

/**
 * Clear the name resolution cache
 * Useful for testing or forcing fresh resolutions
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns Cache size and oldest entry age
 */
export function getCacheStats(): { size: number; oldestEntryAge: number } {
  const now = Date.now();
  let oldestAge = 0;

  for (const entry of cache.values()) {
    const age = now - entry.timestamp;
    if (age > oldestAge) {
      oldestAge = age;
    }
  }

  return {
    size: cache.size,
    oldestEntryAge: oldestAge,
  };
}
