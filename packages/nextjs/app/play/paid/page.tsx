"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { BalanceDisplay } from "~~/components/BalanceDisplay";
import { useAuth } from "~~/contexts/AuthContext";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function PaidMultiplayerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isHumanVerified } = useAuth();
  const [betAmount, setBetAmount] = useState("0.01");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const maxBet = isHumanVerified ? 1000 : 20;
  const { writeContractAsync: createGame } = useScaffoldWriteContract("RPSOnline");
  const { writeContractAsync: joinGame } = useScaffoldWriteContract("RPSOnline");

  const createRoom = async () => {
    if (!address || parseFloat(betAmount) < 0.01 || parseFloat(betAmount) > maxBet) return;

    setIsCreating(true);
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

      await createGame({
        functionName: "createGame",
        args: [roomId],
        value: parseEther(betAmount),
      });

      router.push(`/game/paid/${roomId}`);
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!address || !roomCode || roomCode.length !== 6) return;

    setIsJoining(true);
    try {
      await joinGame({
        functionName: "joinGame",
        args: [roomCode],
        value: parseEther(betAmount),
      });

      router.push(`/game/paid/${roomCode}`);
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-glow-secondary mb-3 animate-glow">Paid Mode</h1>
            <p className="text-base-content/70">Connect Wallet</p>
          </div>
          <div className="w-full">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="w-full bg-gradient-secondary hover:scale-105 transform transition-all duration-200 text-lg font-semibold shadow-glow-secondary rounded-xl py-4 px-6"
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="btn btn-sm btn-ghost">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-glow-primary ml-2">Paid Mode</h1>
        </div>
        <BalanceDisplay address={address} format="full" />
      </div>

      <div className="space-y-6">
        <div className="bg-card/50 backdrop-blur border border-primary/20 rounded-xl p-6">
          <h2 className="flex items-center space-x-2 text-lg font-semibold mb-4">
            <Plus size={20} />
            <span>Create Room</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-base-content/60 block mb-1">Bet Amount (CELO)</label>
              <input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                min={0.01}
                max={maxBet}
                step={0.01}
                className="input input-bordered w-full"
              />
              <p className="text-xs text-base-content/60 mt-1">
                Max: {maxBet} CELO {!isHumanVerified && "(Verify to increase)"}
              </p>
            </div>
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
