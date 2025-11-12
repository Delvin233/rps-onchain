"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { BalanceDisplay } from "~~/components/BalanceDisplay";
import { useAuth } from "~~/contexts/AuthContext";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function PaidMultiplayerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isHumanVerified } = useAuth();
  const [betAmount, setBetAmount] = useState("0.01");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const savedBetAmount = sessionStorage.getItem("paidBetAmount");
    const savedRoomCode = sessionStorage.getItem("paidRoomCode");
    if (savedBetAmount) setBetAmount(savedBetAmount);
    if (savedRoomCode) setRoomCode(savedRoomCode);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("paidBetAmount", betAmount);
  }, [betAmount]);

  useEffect(() => {
    sessionStorage.setItem("paidRoomCode", roomCode);
  }, [roomCode]);

  const { data: roomData } = useScaffoldReadContract({
    contractName: "RPSOnline",
    functionName: "getGame",
    args: roomCode.length === 6 ? [roomCode as string] : [undefined],
    query: {
      enabled: roomCode.length === 6,
    },
  });

  useEffect(() => {
    if (roomData?.betAmount) {
      const roomBet = (Number(roomData.betAmount) / 1e18).toString();
      setBetAmount(roomBet);
    }
  }, [roomData]);

  const maxBet = isHumanVerified ? 1000 : 20;
  const { writeContractAsync: createGame } = useScaffoldWriteContract("RPSOnline");
  const { writeContractAsync: joinGame } = useScaffoldWriteContract("RPSOnline");

  const createRoom = async () => {
    const bet = parseFloat(betAmount);
    if (!address || bet < 0.01 || bet > maxBet) return;

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
      toast.error("Failed to create room", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #ef4444",
        },
      });
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
      toast.error("Failed to join room", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #ef4444",
        },
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-glow-secondary mb-3 animate-glow">Multiplayer</h1>
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
    <div className="min-h-screen bg-base-200 p-6 pt-12 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="btn btn-sm btn-ghost">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-glow-primary ml-2">Multiplayer</h1>
        </div>
        <BalanceDisplay address={address} format="full" />
      </div>

      <div className="space-y-6">
        <div className="bg-info/10 border border-info/30 rounded-xl p-4 text-sm">
          <p className="text-base-content/80">
            <span className="font-semibold">Fee:</span> 0.75% of winnings •
            <span className="text-base-content/60">No fee on timeouts or ties</span>
          </p>
        </div>

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
                Min: 0.01 CELO • Max: {maxBet} CELO {!isHumanVerified && "(Verify to increase)"}
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
            {roomCode.length === 6 && (
              <div>
                <label className="text-sm text-base-content/60 block mb-1">Required Bet Amount</label>
                <input type="text" value={betAmount} readOnly className="input input-bordered w-full bg-base-300" />
                <p className="text-xs text-base-content/60 mt-1">Auto-filled from room</p>
              </div>
            )}
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
