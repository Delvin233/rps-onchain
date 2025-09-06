import { parseEther } from "viem";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function useRPSContract() {
  const { data: contract } = useScaffoldContract({
    contractName: "RPSOnline",
  });

  const { writeContractAsync: createGame } = useScaffoldWriteContract("RPSOnline");
  const { writeContractAsync: joinGame } = useScaffoldWriteContract("RPSOnline");
  const { writeContractAsync: submitMove } = useScaffoldWriteContract("RPSOnline");
  const { writeContractAsync: revealMove } = useScaffoldWriteContract("RPSOnline");
  const { writeContractAsync: claimWinnings } = useScaffoldWriteContract("RPSOnline");

  const createRoom = async (roomId: string, betAmount?: string) => {
    try {
      await createGame({
        functionName: "createGame",
        args: [roomId],
        value: betAmount ? parseEther(betAmount) : parseEther("0"),
      });
      return { success: true };
    } catch (error) {
      console.error("Error creating room:", error);
      return { success: false, error };
    }
  };

  const joinRoom = async (roomId: string, betAmount?: string) => {
    try {
      await joinGame({
        functionName: "joinGame",
        args: [roomId],
        value: betAmount ? parseEther(betAmount) : parseEther("0"),
      });
      return { success: true };
    } catch (error) {
      console.error("Error joining room:", error);
      return { success: false, error };
    }
  };

  const commitMove = async (roomId: string, hashedMove: `0x${string}`) => {
    try {
      await submitMove({
        functionName: "submitMove",
        args: [roomId, hashedMove],
      });
      return { success: true };
    } catch (error) {
      console.error("Error submitting move:", error);
      return { success: false, error };
    }
  };

  const revealPlayerMove = async (roomId: string, move: number, nonce: bigint) => {
    try {
      await revealMove({
        functionName: "revealMove",
        args: [roomId, move, nonce],
      });
      return { success: true };
    } catch (error) {
      console.error("Error revealing move:", error);
      return { success: false, error };
    }
  };

  const claimPrize = async (roomId: string) => {
    try {
      await claimWinnings({
        functionName: "claimWinnings",
        args: [roomId],
      });
      return { success: true };
    } catch (error) {
      console.error("Error claiming winnings:", error);
      return { success: false, error };
    }
  };

  return {
    contract,
    createRoom,
    joinRoom,
    commitMove,
    revealPlayerMove,
    claimPrize,
  };
}

export function useGameData(roomId: string) {
  const { data: gameData, refetch } = useScaffoldReadContract({
    contractName: "RPSOnline",
    functionName: "getGame",
    args: [roomId],
  });

  const { data: isAvailable } = useScaffoldReadContract({
    contractName: "RPSOnline",
    functionName: "isRoomAvailable",
    args: [roomId],
  });

  return {
    gameData,
    isAvailable,
    refetch,
  };
}
