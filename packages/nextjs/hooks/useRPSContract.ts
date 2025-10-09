import { parseEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getDivviReferralTag, submitDivviReferral } from "~~/utils/divviUtils";

export function useRPSContract() {
  const { address } = useAccount();
  const chainId = useChainId();
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
      const referralTag = address ? getDivviReferralTag(address) : '';
      const txHash = await createGame({
        functionName: "createGame",
        args: [roomId],
        value: betAmount ? parseEther(betAmount) : parseEther("0"),
        dataSuffix: referralTag ? referralTag as `0x${string}` : undefined,
      });
      
      if (referralTag && txHash) {
        await submitDivviReferral(txHash, chainId);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error creating room:", error);
      return { success: false, error };
    }
  };

  const joinRoom = async (roomId: string, betAmount?: string) => {
    try {
      const referralTag = address ? getDivviReferralTag(address) : '';
      const txHash = await joinGame({
        functionName: "joinGame",
        args: [roomId],
        value: betAmount ? parseEther(betAmount) : parseEther("0"),
        dataSuffix: referralTag ? referralTag as `0x${string}` : undefined,
      });
      
      if (referralTag && txHash) {
        await submitDivviReferral(txHash, chainId);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error joining room:", error);
      return { success: false, error };
    }
  };

  const commitMove = async (roomId: string, hashedMove: `0x${string}`) => {
    try {
      const referralTag = address ? getDivviReferralTag(address) : '';
      const txHash = await submitMove({
        functionName: "submitMove",
        args: [roomId, hashedMove],
        dataSuffix: referralTag ? referralTag as `0x${string}` : undefined,
      });
      
      if (referralTag && txHash) {
        await submitDivviReferral(txHash, chainId);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error submitting move:", error);
      return { success: false, error };
    }
  };

  const revealPlayerMove = async (roomId: string, move: number, nonce: bigint) => {
    try {
      const referralTag = address ? getDivviReferralTag(address) : '';
      const txHash = await revealMove({
        functionName: "revealMove",
        args: [roomId, move, nonce],
        dataSuffix: referralTag ? referralTag as `0x${string}` : undefined,
      });
      
      if (referralTag && txHash) {
        await submitDivviReferral(txHash, chainId);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error revealing move:", error);
      return { success: false, error };
    }
  };

  const claimPrize = async (roomId: string) => {
    try {
      const referralTag = address ? getDivviReferralTag(address) : '';
      const txHash = await claimWinnings({
        functionName: "claimWinnings",
        args: [roomId],
        dataSuffix: referralTag ? referralTag as `0x${string}` : undefined,
      });
      
      if (referralTag && txHash) {
        await submitDivviReferral(txHash, chainId);
      }
      
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
