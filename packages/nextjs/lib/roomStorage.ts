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

const ROOM_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export const roomStorage = {
  get: (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return undefined;

    // Check if room expired
    if (Date.now() - room.createdAt > ROOM_TTL) {
      rooms.delete(roomId);
      return undefined;
    }

    return room;
  },
  set: (roomId: string, room: Room) => rooms.set(roomId, room),
  delete: (roomId: string) => rooms.delete(roomId),
  has: (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return false;

    // Check if room expired
    if (Date.now() - room.createdAt > ROOM_TTL) {
      rooms.delete(roomId);
      return false;
    }

    return true;
  },
  getAll: () => {
    // Clean up expired rooms
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      if (now - room.createdAt > ROOM_TTL) {
        rooms.delete(roomId);
      }
    }
    return Array.from(rooms.values());
  },
};
