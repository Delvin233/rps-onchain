"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useAccount } from "wagmi";

export default function MultiplayerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const savedRoomCode = sessionStorage.getItem("freeRoomCode");
    if (savedRoomCode) setRoomCode(savedRoomCode);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("freeRoomCode", roomCode);
  }, [roomCode]);

  const createRoom = async () => {
    if (!address) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: address,
          betAmount: "0",
          isFree: true,
        }),
      });

      const data = await response.json();
      if (data.roomId) {
        router.push(`/game/multiplayer/${data.roomId}?mode=free`);
      }
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!address || !roomCode || roomCode.length !== 6) return;

    setIsJoining(true);
    try {
      const response = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: roomCode, joiner: address }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/game/multiplayer/${roomCode}?mode=free`);
      }
    } catch (error) {
      console.error("Error joining room:", error);
    } finally {
      setIsJoining(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-glow-primary mb-3 animate-glow">Free Mode</h1>
            <p className="text-base-content/70">Connect Wallet</p>
          </div>
          <div className="w-full">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="w-full bg-gradient-primary hover:scale-105 transform transition-all duration-200 text-lg font-semibold shadow-glow-primary rounded-xl py-4 px-6"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 p-6 pt-12 pb-24">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="btn btn-sm btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-glow-primary ml-2">Free Mode</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-card/50 backdrop-blur border border-primary/20 rounded-xl p-6">
          <h2 className="flex items-center space-x-2 text-lg font-semibold mb-4">
            <Plus size={20} />
            <span>Create Room</span>
          </h2>
          <div className="space-y-4">
            <button onClick={createRoom} disabled={isCreating || !address} className="btn btn-primary w-full">
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur border border-secondary/20 rounded-xl p-6">
          <h2 className="flex items-center space-x-2 text-lg font-semibold mb-4">
            <Users size={20} />
            <span>Join Room</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-base-content/60 block mb-1">Room Code</label>
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                className="input input-bordered w-full text-center text-lg font-mono"
                placeholder="XXXXXX"
                maxLength={6}
              />
            </div>
            <button
              onClick={joinRoom}
              disabled={isJoining || !address || roomCode.length !== 6}
              className="btn btn-secondary w-full"
            >
              {isJoining ? "Joining..." : "Join Game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
