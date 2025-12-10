import { createClient } from "redis";

interface Room {
  roomId: string;
  chainId: number;
  creator: string;
  creatorPlatform?: string | null;
  joiner: string | null;
  joinerPlatform?: string | null;
  betAmount: string;
  creatorMove: string | null;
  joinerMove: string | null;
  creatorSignature?: string;
  joinerSignature?: string;
  creatorMessage?: string;
  joinerMessage?: string;
  status: string;
  isFree: boolean;
  creatorResult?: string;
  joinerResult?: string;
  createdAt: number;
  rematchRequested?: string | null;
  playerLeft?: string | null;
  ipfsHash?: string;
  joinerVerified?: boolean;
  creatorVerified?: boolean;
  playerNames?: { creator?: string | null; joiner?: string | null };
}

const ROOM_TTL = 60 * 60; // 1 hour in seconds

class RedisManager {
  private static instance: RedisManager;
  private client: ReturnType<typeof createClient> | null = null;
  private connecting = false;
  private connectionPromise: Promise<ReturnType<typeof createClient>> | null = null;

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async getClient(): Promise<ReturnType<typeof createClient>> {
    if (this.client && this.client.isReady) {
      return this.client;
    }

    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = this.connect();

    try {
      this.client = await this.connectionPromise;
      return this.client;
    } finally {
      this.connecting = false;
      this.connectionPromise = null;
    }
  }

  private async connect(): Promise<ReturnType<typeof createClient>> {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: retries => Math.min(retries * 50, 1000), // Exponential backoff
      },
    });

    client.on("error", err => {
      console.error("[Redis] Connection error:", err);
    });

    client.on("reconnecting", () => {
      console.log("[Redis] Reconnecting...");
    });

    await client.connect();
    console.log("[Redis] Connected successfully");
    return client;
  }
}

const redisManager = RedisManager.getInstance();

const getRedis = async () => {
  return redisManager.getClient();
};

export const roomStorage = {
  get: async (roomId: string, chainId?: number): Promise<Room | undefined> => {
    const client = await getRedis();
    if (chainId) {
      const data = await client.get(`room:${chainId}:${roomId}`);
      return data ? JSON.parse(data) : undefined;
    }
    // Fallback: try to find room on any chain
    const keys = await client.keys(`room:*:${roomId}`);
    if (keys.length > 0) {
      const data = await client.get(keys[0]);
      return data ? JSON.parse(data) : undefined;
    }
    return undefined;
  },
  set: async (roomId: string, room: Room): Promise<void> => {
    const client = await getRedis();
    await client.set(`room:${room.chainId}:${roomId}`, JSON.stringify(room), { EX: ROOM_TTL });
  },
  delete: async (roomId: string, chainId: number): Promise<void> => {
    const client = await getRedis();
    await client.del(`room:${chainId}:${roomId}`);
  },
  has: async (roomId: string, chainId: number): Promise<boolean> => {
    const client = await getRedis();
    return (await client.exists(`room:${chainId}:${roomId}`)) === 1;
  },
  getAll: async (chainId?: number): Promise<Room[]> => {
    const client = await getRedis();
    const pattern = chainId ? `room:${chainId}:*` : "room:*";
    const keys = await client.keys(pattern);
    const rooms = await Promise.all(
      keys.map(async key => {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
      }),
    );
    return rooms.filter((room): room is Room => room !== null);
  },
};
