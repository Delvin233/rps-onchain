/**
 * Chain ID utilities for handling CAIP format conversion
 */

/**
 * Parse chain ID from various formats to a numeric chain ID
 * Handles CAIP format (eip155:8453) and string numbers
 */
export function parseChainId(chainId: string | number): number {
  if (typeof chainId === "number") {
    return chainId;
  }

  // Handle CAIP format: "eip155:8453" -> 8453
  if (typeof chainId === "string" && chainId.includes(":")) {
    const parts = chainId.split(":");
    return parseInt(parts[1], 10);
  }

  // Handle string numbers: "8453" -> 8453
  return parseInt(chainId.toString(), 10);
}

/**
 * Convert numeric chain ID to CAIP format
 */
export function toCAIPChainId(chainId: number, namespace: string = "eip155"): string {
  return `${namespace}:${chainId}`;
}
