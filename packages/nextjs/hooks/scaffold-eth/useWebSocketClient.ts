import { useEffect, useState } from "react";
import { PublicClient } from "viem";
import { wsRpcManager } from "~~/utils/websocketRpcManager";

/**
 * Hook to get WebSocket-enabled RPC client for a specific chain
 * Falls back to HTTP if WebSocket is unavailable
 */
export function useWebSocketClient(chainId: number) {
  const [client, setClient] = useState<PublicClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<"websocket" | "http" | "unknown">("unknown");

  useEffect(() => {
    const rpcClient = wsRpcManager.getClient(chainId);

    if (rpcClient) {
      setClient(rpcClient);

      // Check if it's using WebSocket transport
      const transport = (rpcClient as any).transport;
      if (transport?.type === "webSocket") {
        setConnectionType("websocket");
        setIsConnected(true);
      } else if (transport?.type === "http") {
        setConnectionType("http");
        setIsConnected(true);
      }
    }

    // Health check
    const checkConnection = async () => {
      if (rpcClient) {
        try {
          await rpcClient.getBlockNumber();
          setIsConnected(true);
        } catch {
          setIsConnected(false);
        }
      }
    };

    checkConnection();

    // Periodic health check every 30 seconds
    const healthCheckInterval = setInterval(checkConnection, 30000);

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [chainId]);

  return {
    client,
    isConnected,
    connectionType,
  };
}

/**
 * Hook specifically for Base network
 */
export function useBaseWebSocketClient() {
  return useWebSocketClient(8453); // Base mainnet
}

/**
 * Hook specifically for Celo network
 */
export function useCeloWebSocketClient() {
  return useWebSocketClient(42220); // Celo mainnet
}
