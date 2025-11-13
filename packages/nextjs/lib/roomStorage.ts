import { createClient } from "redis";

interface Room {
  roomId: string;
  chainId: number;
  creator: string;
  joiner: string | null;
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
}

const ROOM_TTL = 60 * 60; // 1 hour in seconds

let redis: ReturnType<typeof createClient> | null = null;

const getRedis = async () => {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  }
  return redis;
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
