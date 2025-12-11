import { Chain, PublicClient, createPublicClient, http, webSocket } from "viem";
import { base, celo } from "viem/chains";

interface RpcEndpoint {
  name: string;
  wsUrl?: string;
  httpUrl?: string;
  priority: number;
  maxRetries: number;
  timeout: number;
}

interface ChainConfig {
  chain: Chain;
  endpoints: RpcEndpoint[];
}

class WebSocketRpcManager {
  private clients: Map<string, PublicClient> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();
  private failureCount: Map<string, number> = new Map();
  private lastFailure: Map<string, number> = new Map();
  private circuitBreakerThreshold = 3;
  private circuitBreakerTimeout = 60000; // 1 minute
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  private chainConfigs: ChainConfig[] = [
    {
      chain: base,
      endpoints: [
        {
          name: "alchemy-base",
          wsUrl: process.env.NEXT_PUBLIC_ALCHEMY_WS_BASE,
          httpUrl: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
          priority: 1,
          maxRetries: 2,
          timeout: 10000,
        },
        {
          name: "drpc-base",
          wsUrl: process.env.NEXT_PUBLIC_DRPC_WS_BASE,
          httpUrl: `https://lb.drpc.org/ogrpc?network=base&dkey=${process.env.NEXT_PUBLIC_DRPC_API_KEY}`,
          priority: 2,
          maxRetries: 2,
          timeout: 8000,
        },
        {
          name: "thirdweb-base",
          httpUrl: `https://base.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`,
          priority: 3,
          maxRetries: 1,
          timeout: 12000,
        },
      ],
    },
    {
      chain: celo,
      endpoints: [
        {
          name: "alchemy-celo",
          wsUrl: process.env.NEXT_PUBLIC_ALCHEMY_WS_CELO,
          httpUrl: `https://celo-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
          priority: 1,
          maxRetries: 2,
          timeout: 10000,
        },
        {
          name: "drpc-celo",
          wsUrl: process.env.NEXT_PUBLIC_DRPC_WS_CELO,
          httpUrl: `https://lb.drpc.org/ogrpc?network=celo&dkey=${process.env.NEXT_PUBLIC_DRPC_API_KEY}`,
          priority: 2,
          maxRetries: 2,
          timeout: 8000,
        },
        {
          name: "forno-celo",
          httpUrl: "https://forno.celo.org",
          priority: 3,
          maxRetries: 1,
          timeout: 15000,
        },
      ],
    },
  ];

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    for (const config of this.chainConfigs) {
      const availableEndpoints = config.endpoints.filter(endpoint => endpoint.wsUrl || endpoint.httpUrl);

      if (availableEndpoints.length === 0) continue;

      const clientKey = `${config.chain.id}`;

      // Check if we're in MiniPay or other WebSocket-limited environment
      const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
      const isWebSocketSupported = typeof window !== "undefined" && "WebSocket" in window;

      // Use HTTP for MiniPay or when WebSocket is not supported
      const shouldUseHttp = isMiniPay || !isWebSocketSupported;

      const primaryEndpoint = shouldUseHttp
        ? availableEndpoints.find(e => e.httpUrl) || availableEndpoints[0]
        : availableEndpoints[0];

      try {
        if (!shouldUseHttp && primaryEndpoint.wsUrl) {
          console.log(`🔌 Initializing WebSocket client for ${config.chain.name} via ${primaryEndpoint.name}`);
          const client = createPublicClient({
            chain: config.chain,
            transport: webSocket(primaryEndpoint.wsUrl, {
              timeout: primaryEndpoint.timeout,
              retryCount: primaryEndpoint.maxRetries,
            }),
          });
          this.clients.set(clientKey, client);
          this.setupWebSocketMonitoring(clientKey, primaryEndpoint);
        } else if (primaryEndpoint.httpUrl) {
          const reason = shouldUseHttp
            ? isMiniPay
              ? "MiniPay detected"
              : "WebSocket not supported"
            : "WebSocket unavailable";
          console.log(`🌐 Initializing HTTP client for ${config.chain.name} via ${primaryEndpoint.name} (${reason})`);
          const client = createPublicClient({
            chain: config.chain,
            transport: http(primaryEndpoint.httpUrl, {
              timeout: primaryEndpoint.timeout,
              retryCount: primaryEndpoint.maxRetries,
            }),
          });
          this.clients.set(clientKey, client);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize primary client for ${config.chain.name}:`, error);
        this.tryFallbackClient(config, clientKey);
      }
    }
  }

  private setupWebSocketMonitoring(clientKey: string, endpoint: RpcEndpoint) {
    if (!endpoint.wsUrl || typeof window === "undefined") return;

    try {
      // Monitor WebSocket connection health
      const ws = new WebSocket(endpoint.wsUrl);
      this.wsConnections.set(clientKey, ws);

      ws.onopen = () => {
        console.log(`✅ WebSocket connected: ${endpoint.name}`);
        this.recordSuccess(endpoint.name);
        this.reconnectAttempts.set(clientKey, 0);
      };

      ws.onclose = event => {
        console.warn(`🔌 WebSocket disconnected: ${endpoint.name}`, event.code, event.reason);
        this.recordFailure(endpoint.name);
        this.handleWebSocketReconnect(clientKey, endpoint);
      };

      ws.onerror = error => {
        console.error(`❌ WebSocket error: ${endpoint.name}`, error);
        this.recordFailure(endpoint.name);
      };
    } catch (error) {
      console.error(`❌ Failed to setup WebSocket monitoring for ${endpoint.name}:`, error);
    }
  }

  private handleWebSocketReconnect(clientKey: string, endpoint: RpcEndpoint) {
    const attempts = this.reconnectAttempts.get(clientKey) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.warn(`�c Max reconnect attempts reached for ${endpoint.name}, switching to HTTP fallback`);
      this.switchToHttpFallback(clientKey);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff, max 30s
    console.log(`🔄 Reconnecting WebSocket in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.reconnectAttempts.set(clientKey, attempts + 1);
      this.setupWebSocketMonitoring(clientKey, endpoint);
    }, delay);
  }

  private switchToHttpFallback(clientKey: string) {
    const chainId = parseInt(clientKey);
    const config = this.chainConfigs.find(c => c.chain.id === chainId);

    if (!config) return;

    // Find HTTP fallback endpoint
    const httpEndpoint = config.endpoints.find(e => e.httpUrl && !e.wsUrl);

    if (httpEndpoint?.httpUrl) {
      console.log(`🌐 Switching to HTTP fallback: ${httpEndpoint.name}`);
      try {
        const client = createPublicClient({
          chain: config.chain,
          transport: http(httpEndpoint.httpUrl, {
            timeout: httpEndpoint.timeout,
            retryCount: httpEndpoint.maxRetries,
          }),
        });
        this.clients.set(clientKey, client);
      } catch (error) {
        console.error(`❌ Failed to switch to HTTP fallback:`, error);
      }
    }
  }

  private tryFallbackClient(config: ChainConfig, clientKey: string) {
    const fallbackEndpoints = config.endpoints.slice(1); // Skip the first (failed) endpoint

    for (const endpoint of fallbackEndpoints) {
      try {
        if (endpoint.wsUrl && typeof window !== "undefined") {
          const client = createPublicClient({
            chain: config.chain,
            transport: webSocket(endpoint.wsUrl, {
              timeout: endpoint.timeout,
              retryCount: endpoint.maxRetries,
            }),
          });
          this.clients.set(clientKey, client);
          this.setupWebSocketMonitoring(clientKey, endpoint);
          console.log(`✅ Fallback WebSocket client initialized: ${endpoint.name}`);
          return;
        } else if (endpoint.httpUrl) {
          const client = createPublicClient({
            chain: config.chain,
            transport: http(endpoint.httpUrl, {
              timeout: endpoint.timeout,
              retryCount: endpoint.maxRetries,
            }),
          });
          this.clients.set(clientKey, client);
          console.log(`✅ Fallback HTTP client initialized: ${endpoint.name}`);
          return;
        }
      } catch (error) {
        console.warn(`⚠️ Fallback endpoint failed: ${endpoint.name}`, error);
        continue;
      }
    }

    console.error(`❌ All endpoints failed for chain ${config.chain.name}`);
  }

  private isCircuitBreakerOpen(endpointName: string): boolean {
    const failures = this.failureCount.get(endpointName) || 0;
    const lastFailureTime = this.lastFailure.get(endpointName) || 0;

    if (failures >= this.circuitBreakerThreshold) {
      const timeSinceLastFailure = Date.now() - lastFailureTime;
      return timeSinceLastFailure < this.circuitBreakerTimeout;
    }

    return false;
  }

  private recordFailure(endpointName: string) {
    const currentFailures = this.failureCount.get(endpointName) || 0;
    this.failureCount.set(endpointName, currentFailures + 1);
    this.lastFailure.set(endpointName, Date.now());
  }

  private recordSuccess(endpointName: string) {
    this.failureCount.set(endpointName, 0);
  }

  // Public methods for getting clients
  getClient(chainId: number): PublicClient | null {
    return this.clients.get(chainId.toString()) || null;
  }

  getBaseClient(): PublicClient | null {
    return this.getClient(base.id);
  }

  getCeloClient(): PublicClient | null {
    return this.getClient(celo.id);
  }

  // Health check method
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const [chainId, client] of this.clients.entries()) {
      try {
        await client.getBlockNumber();
        results[chainId] = true;
      } catch {
        results[chainId] = false;
      }
    }

    return results;
  }

  // Cleanup method
  cleanup() {
    for (const ws of this.wsConnections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    this.wsConnections.clear();
    this.clients.clear();
  }
}

// Export singleton instance
export const wsRpcManager = new WebSocketRpcManager();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    wsRpcManager.cleanup();
  });
}
