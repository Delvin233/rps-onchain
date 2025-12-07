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
    console.error("[NameResolver] Basename resolution failed:", error);
    return null;
  }
}

/**
 * Resolve Farcaster username for an address
 * Note: This would require Farcaster API integration
 * For now, returns null - can be implemented later
 * @returns Farcaster username or null
 */
async function resolveFarcaster(): Promise<string | null> {
  // TODO: Implement Farcaster username resolution via API
  // This would require calling Farcaster's API or using a service like Neynar
  return null;
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
 * @returns Display name (ENS/Basename/Farcaster/truncated address)
 */
export async function resolveDisplayName(address: string): Promise<string> {
  const lowerAddress = address.toLowerCase();

  // Check cache first
  const cached = cache.get(lowerAddress);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.name;
  }

  // Try resolution methods in priority order
  try {
    // 1. Try Farcaster (if implemented)
    const farcasterName = await resolveFarcaster();
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
 * @param addresses - Array of Ethereum addresses
 * @returns Map of address to display name
 */
export async function batchResolveDisplayNames(addresses: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Resolve in parallel with a limit to avoid overwhelming the RPC
  const batchSize = 10;
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const promises = batch.map(async address => {
      const name = await resolveDisplayName(address);
      return { address: address.toLowerCase(), name };
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ address, name }) => {
      results.set(address, name);
    });
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
