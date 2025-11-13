import { createClient } from "redis";

interface Room {
  roomId: string;
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
  get: async (roomId: string): Promise<Room | undefined> => {
    const client = await getRedis();
    const data = await client.get(`room:${roomId}`);
    return data ? JSON.parse(data) : undefined;
  },
  set: async (roomId: string, room: Room): Promise<void> => {
    const client = await getRedis();
    await client.set(`room:${roomId}`, JSON.stringify(room), { EX: ROOM_TTL });
  },
  delete: async (roomId: string): Promise<void> => {
    const client = await getRedis();
    await client.del(`room:${roomId}`);
  },
  has: async (roomId: string): Promise<boolean> => {
    const client = await getRedis();
    return (await client.exists(`room:${roomId}`)) === 1;
  },
  getAll: async (): Promise<Room[]> => {
    const client = await getRedis();
    const keys = await client.keys("room:*");
    const rooms = await Promise.all(
      keys.map(async key => {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
      }),
    );
    return rooms.filter((room): room is Room => room !== null);
  },
};
