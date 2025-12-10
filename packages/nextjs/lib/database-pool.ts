import { createClient } from "@libsql/client";

interface PooledClient {
  client: ReturnType<typeof createClient>;
  inUse: boolean;
  lastUsed: number;
}

class DatabasePool {
  private static instance: DatabasePool;
  private pool: PooledClient[] = [];
  private readonly maxConnections = 15; // Conservative limit
  private readonly idleTimeout = 30000; // 30 seconds
  private readonly acquireTimeout = 5000; // 5 seconds max wait

  private constructor() {
    // Cleanup idle connections every minute
    setInterval(() => this.cleanupIdleConnections(), 60000);
  }

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  private createClient(): ReturnType<typeof createClient> {
    return createClient({
      url: process.env.TURSO_DATABASE_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    this.pool = this.pool.filter(pooledClient => {
      if (!pooledClient.inUse && now - pooledClient.lastUsed > this.idleTimeout) {
        // Close idle connection
        try {
          pooledClient.client.close();
        } catch (error) {
          console.warn("[DatabasePool] Error closing idle connection:", error);
        }
        return false;
      }
      return true;
    });
  }

  async acquireConnection(): Promise<ReturnType<typeof createClient>> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.acquireTimeout) {
      // Try to find an available connection
      const availableConnection = this.pool.find(pc => !pc.inUse);

      if (availableConnection) {
        availableConnection.inUse = true;
        availableConnection.lastUsed = Date.now();
        return availableConnection.client;
      }

      // Create new connection if under limit
      if (this.pool.length < this.maxConnections) {
        const client = this.createClient();
        const pooledClient: PooledClient = {
          client,
          inUse: true,
          lastUsed: Date.now(),
        };
        this.pool.push(pooledClient);
        return client;
      }

      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error(`[DatabasePool] Failed to acquire connection within ${this.acquireTimeout}ms`);
  }

  releaseConnection(client: ReturnType<typeof createClient>): void {
    const pooledClient = this.pool.find(pc => pc.client === client);
    if (pooledClient) {
      pooledClient.inUse = false;
      pooledClient.lastUsed = Date.now();
    }
  }

  async withConnection<T>(operation: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
    const client = await this.acquireConnection();
    try {
      return await operation(client);
    } finally {
      this.releaseConnection(client);
    }
  }

  getPoolStats() {
    return {
      total: this.pool.length,
      inUse: this.pool.filter(pc => pc.inUse).length,
      available: this.pool.filter(pc => !pc.inUse).length,
      maxConnections: this.maxConnections,
    };
  }
}

// Export singleton instance
export const dbPool = DatabasePool.getInstance();

// Helper function for easy usage
export async function withDatabase<T>(operation: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  return dbPool.withConnection(operation);
}
