// Shared in-memory storage for rooms
// WARNING: This will NOT work reliably on Vercel serverless functions!
// Each API route may run on a different serverless instance with separate memory.
// For production on Vercel, use: Vercel KV, Redis, or a database.
// Note: This will be lost on server restart. Use database for production.

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
}

// Use global to persist across hot reloads in dev mode
const globalForRooms = global as typeof globalThis & {
  rooms: Map<string, Room>;
};

if (!globalForRooms.rooms) {
  globalForRooms.rooms = new Map<string, Room>();
}

const rooms = globalForRooms.rooms;

export const roomStorage = {
  get: (roomId: string) => rooms.get(roomId),
  set: (roomId: string, room: Room) => rooms.set(roomId, room),
  delete: (roomId: string) => rooms.delete(roomId),
  has: (roomId: string) => rooms.has(roomId),
  getAll: () => Array.from(rooms.values()),
};
