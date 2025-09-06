import { encodePacked, keccak256 } from "viem";

export function generateNonce(): bigint {
  return BigInt(Math.floor(Math.random() * 1000000));
}

export function hashMove(move: number, nonce: bigint, player: string): string {
  return keccak256(encodePacked(["uint8", "uint256", "address"], [move, nonce, player as `0x${string}`]));
}

export function moveToNumber(move: string): number {
  const moves = { rock: 1, paper: 2, scissors: 3 };
  return moves[move as keyof typeof moves];
}

export function numberToMove(num: number): string {
  const moves = { 1: "rock", 2: "paper", 3: "scissors" };
  return moves[num as keyof typeof moves];
}
