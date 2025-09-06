"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useGameData, useRPSContract } from "~~/hooks/useRPSContract";

export default function PlayPage() {
  const { isConnected } = useAccount();
  const { createRoom: createContractRoom, joinRoom: joinContractRoom } = useRPSContract();
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [betAmount, setBetAmount] = useState("0.01");
  const [joinBetAmount, setJoinBetAmount] = useState("");
  const { gameData: joinGameData } = useGameData(joinRoomId);

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
    setIsJoining(true);

    try {
      const result = await joinContractRoom(joinRoomId, joinBetAmount);
      if (result.success) {
        console.log("Joined room successfully on blockchain");
        window.location.href = `/game/${joinRoomId}`;
      } else {
        console.error("Failed to join room:", result.error);
        const requiredBet = joinGameData ? (Number(joinGameData.betAmount) / 1e18).toFixed(4) : "unknown";
        alert(`Failed to join room. Required bet: ${requiredBet} ETH`);
      }
    } catch (error) {
      console.error("Error joining room:", error);
      const requiredBet = joinGameData ? (Number(joinGameData.betAmount) / 1e18).toFixed(4) : "unknown";
      alert(`Error joining room. Required bet: ${requiredBet} ETH`);
    }
    setIsJoining(false);
  };

  const startPolling = (roomId: string) => {
    const interval = setInterval(async () => {
      // Poll contract for game state changes
      // For now, redirect after 3 seconds to allow for blockchain confirmation
      setTimeout(() => {
        clearInterval(interval);
        window.location.href = `/game/${roomId}`;
      }, 3000);
    }, 1000);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
          <p className="text-gray-300 text-sm mb-6">CONNECT WALLET TO PLAY</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
        <div className="space-y-6 max-w-md mx-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl text-white">CREATE ROOM</h2>
              <Link href="/history" className="text-purple-400 hover:text-purple-300 text-sm">
                View History →
              </Link>
            </div>

            {!roomId ? (
              <div className="space-y-3">
                <p className="text-gray-300 text-sm">Create a room and share the Room ID with your opponent</p>
                <div className="space-y-2">
                  <label className="text-gray-300 text-xs">Bet Amount (ETH)</label>
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
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 text-sm font-bold rounded"
                >
                  {isCreating ? "CREATING..." : `CREATE ROOM (${betAmount} ETH)`}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-700 p-4 rounded">
                  <p className="text-white text-sm font-bold mb-2">ROOM CREATED!</p>
                  <p className="text-gray-300 text-xs mb-2">Room ID:</p>
                  <p className="text-white text-lg font-mono bg-gray-600 p-2 rounded">{roomId}</p>
                  <p className="text-gray-300 text-xs mt-2">Share this Room ID with your opponent</p>
                </div>

                <div className="bg-yellow-600 p-3 rounded">
                  <p className="text-white text-sm font-bold">WAITING FOR OPPONENT...</p>
                </div>

                <button
                  onClick={() => setRoomId("")}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded"
                >
                  CREATE NEW ROOM
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h2 className="text-xl text-white mb-4">JOIN ROOM</h2>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">Enter Room ID to join an existing game</p>
              <input
                type="text"
                value={joinRoomId}
                onChange={e => {
                  const roomId = e.target.value.toUpperCase();
                  setJoinRoomId(roomId);
                  if (roomId.length === 6) {
                    // Auto-fill bet amount when room is found
                    setTimeout(() => {
                      if (joinGameData && joinGameData.betAmount) {
                        const requiredBet = (Number(joinGameData.betAmount) / 1e18).toString();
                        setJoinBetAmount(requiredBet);
                      }
                    }, 1000);
                  }
                }}
                placeholder="Enter Room ID"
                className="w-full bg-gray-600 text-white p-2 text-sm rounded font-mono"
                maxLength={6}
              />
              {joinGameData && joinGameData.player1 !== "0x0000000000000000000000000000000000000000" && (
                <div className="bg-blue-600 p-3 rounded">
                  <p className="text-white text-sm font-bold">Room Found!</p>
                  <p className="text-white text-xs">
                    Required Bet: {(Number(joinGameData.betAmount) / 1e18).toFixed(4)} ETH
                  </p>
                  <p className="text-white text-xs">
                    Creator: {joinGameData.player1.slice(0, 6)}...{joinGameData.player1.slice(-4)}
                  </p>
                </div>
              )}
              {joinRoomId.length === 6 &&
                joinGameData &&
                joinGameData.player1 === "0x0000000000000000000000000000000000000000" && (
                  <div className="bg-red-600 p-3 rounded">
                    <p className="text-white text-sm font-bold">Room Not Found</p>
                    <p className="text-white text-xs">Check the Room ID and try again</p>
                  </div>
                )}
              <div className="space-y-2">
                <label className="text-gray-300 text-xs">Match Bet Amount (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={joinBetAmount}
                  onChange={e => setJoinBetAmount(e.target.value)}
                  className="w-full bg-gray-600 text-white p-2 text-sm rounded"
                  placeholder="Enter bet amount"
                />
              </div>
              <button
                onClick={joinRoom}
                disabled={isJoining || !joinRoomId.trim() || !joinBetAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-4 text-sm font-bold rounded"
              >
                {isJoining ? "JOINING..." : `JOIN ROOM (${joinBetAmount || "0"} ETH)`}
              </button>
            </div>
          </div>

          <Link href="/">
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded">
              BACK TO MENU
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
