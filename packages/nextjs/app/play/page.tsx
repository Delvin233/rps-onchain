"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useGameData, useRPSContract } from "~~/hooks/useRPSContract";

export default function PlayPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const {
    createRoom: createContractRoom,
    joinRoom: joinContractRoom,
    cancelRoom: cancelContractRoom,
  } = useRPSContract();
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [betAmount, setBetAmount] = useState("0.01");
  const [joinBetAmount, setJoinBetAmount] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const { gameData: joinGameData } = useGameData(joinRoomId);
  const { gameData: createdGameData, refetch: refetchCreatedGame } = useGameData(roomId);

  const createRoom = async () => {
    setIsCreating(true);
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const result = await createContractRoom(newRoomId, betAmount);
      if (result.success) {
        console.log("Room created successfully on blockchain");
        setRoomId(newRoomId);
        startPolling(newRoomId);
      } else {
        console.error("Failed to create room:", result.error);
        alert("Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room");
    }
    setIsCreating(false);
  };

  const joinRoom = async () => {
    if (!joinRoomId.trim()) return;

    // Warning if user has active room
    if (roomId) {
      const confirmed = confirm(
        `⚠️ WARNING: You have an active room (${roomId}) with ${betAmount} CELO staked.\n\n` +
          `Joining another room will stake additional ${joinBetAmount} CELO.\n\n` +
          `Consider cancelling your current room first to avoid locking multiple funds.\n\n` +
          `Continue anyway?`,
      );
      if (!confirmed) return;
    }

    setIsJoining(true);

    try {
      const result = await joinContractRoom(joinRoomId, joinBetAmount);
      if (result.success) {
        console.log("Joined room successfully on blockchain");
        router.push(`/game/${joinRoomId}`);
      } else {
        console.error("Failed to join room:", result.error);
        const requiredBet = joinGameData ? (Number(joinGameData.betAmount) / 1e18).toFixed(4) : "unknown";
        alert(`Failed to join room. Required bet: ${requiredBet} CELO`);
      }
    } catch (error) {
      console.error("Error joining room:", error);
      const requiredBet = joinGameData ? (Number(joinGameData.betAmount) / 1e18).toFixed(4) : "unknown";
      alert(`Error joining room. Required bet: ${requiredBet} CELO`);
    }
    setIsJoining(false);
  };

  const startPolling = (roomId: string) => {
    console.log(`Room ${roomId} created, waiting for opponent...`);
  };

  // Auto-populate bet amount when room data loads
  useEffect(() => {
    if (joinGameData && joinGameData.betAmount && joinRoomId.length === 6) {
      const requiredBet = (Number(joinGameData.betAmount) / 1e18).toString();
      setJoinBetAmount(requiredBet);
    }
  }, [joinGameData, joinRoomId]);

  // Poll for opponent joining
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(async () => {
      await refetchCreatedGame();
      if (createdGameData && createdGameData.player2 !== "0x0000000000000000000000000000000000000000") {
        console.log("Opponent joined! Redirecting to game...");
        clearInterval(interval);
        router.push(`/game/${roomId}`);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [roomId, createdGameData, refetchCreatedGame, router]);

  const cancelRoom = async () => {
    if (!roomId) return;
    setIsCancelling(true);

    try {
      const result = await cancelContractRoom(roomId);
      if (result.success) {
        console.log("Room cancelled successfully");
        setRoomId("");
        alert("Room cancelled and bet refunded!");
      } else {
        console.error("Failed to cancel room:", result.error);
        alert("Failed to cancel room");
      }
    } catch (error) {
      console.error("Error cancelling room:", error);
      alert("Error cancelling room");
    }
    setIsCancelling(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="card-gaming rounded-2xl p-8 max-w-2xl w-full text-center animate-fade-in-up">
          <p className="text-gray-300 text-sm mb-6">CONNECT WALLET TO PLAY</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="card-gaming rounded-2xl p-8 max-w-2xl w-full text-center animate-fade-in-up">
        <div className="space-y-6 max-w-md mx-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
                CREATE ROOM
              </h2>
              <Link
                href="/history"
                className="text-neon-purple hover:text-neon-blue text-sm transition-colors duration-300"
              >
                View History →
              </Link>
            </div>

            {roomId && (
              <div className="card-gaming bg-yellow-600/20 border-yellow-500 p-4 rounded-xl mb-4 animate-pulse-soft">
                <p className="text-yellow-400 text-sm font-bold flex items-center">
                  <span className="mr-2">⚠️</span> Active Room: {roomId}
                </p>
                <p className="text-yellow-200 text-xs mt-1">
                  You have {betAmount} CELO staked. Cancel to get refund or wait for opponent.
                </p>
              </div>
            )}

            {!roomId ? (
              <div className="space-y-3">
                <p className="text-gray-300 text-sm">Create a room and share the Room ID with your opponent</p>
                <div className="space-y-2">
                  <label className="text-gray-300 text-xs">Bet Amount (CELO)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={betAmount}
                    onChange={e => setBetAmount(e.target.value)}
                    className="w-full bg-gray-600 text-white p-2 text-sm rounded"
                    placeholder="0.01"
                  />
                </div>
                <button
                  onClick={createRoom}
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-white py-3 px-6 text-sm font-bold rounded-xl shadow-glow transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {isCreating ? "CREATING..." : `CREATE ROOM (${betAmount} CELO)`}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="card-gaming p-6 rounded-xl animate-scale-in">
                  <p className="text-neon-green text-sm font-bold mb-3 flex items-center justify-center">
                    <span className="w-2 h-2 bg-neon-green rounded-full mr-2 animate-pulse-soft"></span>
                    ROOM CREATED!
                  </p>
                  <p className="text-gray-400 text-xs mb-2">Room ID:</p>
                  <p className="text-white text-2xl font-mono bg-gray-900/50 p-3 rounded-lg shadow-glow">{roomId}</p>
                  <p className="text-gray-400 text-xs mt-3">Share this Room ID with your opponent</p>
                </div>

                <div className="card-gaming bg-yellow-600/20 border-yellow-500 p-4 rounded-xl animate-pulse-soft">
                  <p className="text-yellow-400 text-sm font-bold"> WAITING FOR OPPONENT...</p>
                </div>

                <button
                  onClick={cancelRoom}
                  disabled={isCancelling}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white py-3 px-6 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105"
                >
                  {isCancelling ? "CANCELLING..." : "❌ CANCEL ROOM & GET REFUND"}
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent mb-4">
              JOIN ROOM
            </h2>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">Enter Room ID to join an existing game</p>
              <input
                type="text"
                value={joinRoomId}
                onChange={e => {
                  const roomId = e.target.value.toUpperCase();
                  setJoinRoomId(roomId);
                  if (roomId.length !== 6) {
                    setJoinBetAmount("");
                  }
                }}
                placeholder="Enter Room ID"
                className="w-full bg-gray-600 text-white p-2 text-sm rounded font-mono"
                maxLength={6}
              />
              {joinGameData && joinGameData.player1 !== "0x0000000000000000000000000000000000000000" && (
                <div className="card-gaming bg-blue-600/20 border-blue-500 p-4 rounded-xl animate-scale-in">
                  <p className="text-blue-400 text-sm font-bold">✓ Room Found!</p>
                  <p className="text-white text-xs">
                    Required Bet: {(Number(joinGameData.betAmount) / 1e18).toFixed(4)} CELO
                  </p>
                  <p className="text-white text-xs">
                    Creator: {joinGameData.player1.slice(0, 6)}...{joinGameData.player1.slice(-4)}
                  </p>
                </div>
              )}
              {joinRoomId.length === 6 &&
                joinGameData &&
                joinGameData.player1 === "0x0000000000000000000000000000000000000000" && (
                  <div className="card-gaming bg-red-600/20 border-red-500 p-4 rounded-xl">
                    <p className="text-red-400 text-sm font-bold">✗ Room Not Found</p>
                    <p className="text-white text-xs">Check the Room ID and try again</p>
                  </div>
                )}
              {joinGameData &&
                joinGameData.player1 !== "0x0000000000000000000000000000000000000000" &&
                joinBetAmount && (
                  <div className="card-gaming bg-green-600/20 border-green-500 p-6 rounded-xl animate-scale-in">
                    <p className="text-white text-sm font-bold mb-2">Ready to Join!</p>
                    <p className="text-white text-xs mb-2">
                      You will stake: <span className="font-bold">{joinBetAmount} CELO</span>
                    </p>
                    <p className="text-white text-xs mb-3">
                      Winner takes: <span className="font-bold">{(parseFloat(joinBetAmount) * 2).toFixed(4)} CELO</span>
                    </p>
                    <button
                      onClick={joinRoom}
                      disabled={isJoining}
                      className="w-full btn-gaming-primary disabled:opacity-50 py-3 px-6 text-white text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      {isJoining ? "JOINING..." : "✓ CONFIRM & JOIN MATCH"}
                    </button>
                  </div>
                )}

              {joinRoomId.length === 6 &&
                joinGameData &&
                joinGameData.player1 !== "0x0000000000000000000000000000000000000000" &&
                !joinBetAmount && (
                  <div className="card-gaming bg-yellow-600/20 border-yellow-500 p-4 rounded-xl animate-pulse-soft">
                    <p className="text-yellow-400 text-sm font-bold"> Loading bet amount...</p>
                  </div>
                )}
            </div>
          </div>

          {!roomId && (
            <Link href="/">
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 text-sm font-bold rounded-xl border border-gray-600 transition-all duration-300 hover:scale-105">
                ← BACK TO MENU
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
