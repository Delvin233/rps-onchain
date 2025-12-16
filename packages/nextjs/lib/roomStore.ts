interface Room {
  id: string;
  creator: string;
  creatorUsername: string;
  joiner?: string;
  joinerUsername?: string;
  status: "waiting" | "ready" | "playing" | "finished" | "ended";
  createdAt: number;
  moves?: {
    creator?: "rock" | "paper" | "scissors";
    joiner?: "rock" | "paper" | "scissors";
  };
  result?: {
    winner: "creator" | "joiner" | "tie";
    creatorMove: string;
    joinerMove: string;
  };
  playAgainRequest?: string; // address of player who requested
}

const rooms = new Map<string, Room>();

export function createRoom(id: string, creator: string, creatorUsername: string): Room {
  const room: Room = {
    id,
    creator: creator.toLowerCase(), // Normalize to lowercase
    creatorUsername,
    status: "waiting",
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  console.log(`Room created: ${id}, total rooms: ${rooms.size}`);
  return room;
}

export function joinRoom(id: string, joiner: string, joinerUsername: string): Room | null {
  const room = rooms.get(id);
  if (!room || room.status !== "waiting") return null;

  room.joiner = joiner.toLowerCase(); // Normalize to lowercase
  room.joinerUsername = joinerUsername;
  room.status = "ready";
  return room;
}

export function getRoom(id: string): Room | null {
  const room = rooms.get(id) || null;
  console.log(`Getting room ${id}: ${room ? "found" : "not found"}, total rooms: ${rooms.size}`);
  if (rooms.size > 0) {
    console.log("Available rooms:", Array.from(rooms.keys()));
  }
  return room;
}

export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}

export function requestPlayAgain(roomId: string, player: string): Room | null {
  const room = rooms.get(roomId);
  if (!room || room.status !== "finished") return null;

  room.playAgainRequest = player.toLowerCase(); // Normalize to lowercase
  return room;
}

export function resetGame(roomId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room || room.status === "ended") return null;

  room.moves = {};
  room.result = undefined;
  room.playAgainRequest = undefined;
  room.status = "ready";
  return room;
}

export function leaveRoom(roomId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.status = "ended";
  return room;
}

export function endMatch(roomId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.status = "ended";
  return room;
}

export function makeMove(roomId: string, player: string, move: "rock" | "paper" | "scissors"): Room | null {
  const room = rooms.get(roomId);
  if (!room || room.status !== "ready") return null;

  if (!room.moves) room.moves = {};

  const playerLower = player.toLowerCase(); // Normalize for comparison
  if (playerLower === room.creator) {
    room.moves.creator = move;
  } else if (playerLower === room.joiner) {
    room.moves.joiner = move;
  } else {
    return null;
  }

  // Check if both players made moves
  if (room.moves.creator && room.moves.joiner) {
    room.result = calculateWinner(room.moves.creator, room.moves.joiner);
    room.status = "finished";
  }

  return room;
}

function calculateWinner(creatorMove: string, joinerMove: string) {
  if (creatorMove === joinerMove) {
    return { winner: "tie" as const, creatorMove, joinerMove };
  }

  const winConditions = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };

  if (winConditions[creatorMove as keyof typeof winConditions] === joinerMove) {
    return { winner: "creator" as const, creatorMove, joinerMove };
  } else {
    return { winner: "joiner" as const, creatorMove, joinerMove };
  }
}
