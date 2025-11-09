"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { useAuth } from "~~/contexts/AuthContext";

export default function MultiplayerPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { isHumanVerified } = useAuth();
  const [mode, setMode] = useState<"select" | "free" | "paid">("select");
  const [betAmount, setBetAmount] = useState("0.01");
  const [roomCode, setRoomCode] = useState("");
  const [roomBetAmount, setRoomBetAmount] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const maxBet = isHumanVerified ? 1000 : 20;

  const createRoom = async () => {
    if (!address) return;
    if (mode === "paid" && (parseFloat(betAmount) <= 0 || parseFloat(betAmount) > maxBet)) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: address,
          betAmount: mode === "free" ? "0" : betAmount,
          isFree: mode === "free",
        }),
      });

      const data = await response.json();
      if (data.roomId) {
        router.push(`/game/multiplayer/${data.roomId}?mode=${mode}`);
      }
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const checkRoom = async (code: string) => {
    if (code.length !== 6) return;

    try {
      const response = await fetch(`/api/room/info?roomId=${code}`);
      const data = await response.json();
      if (data.betAmount) {
        setRoomBetAmount(data.betAmount);
      }
    } catch {
      setRoomBetAmount(null);
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
        router.push(`/game/multiplayer/${roomCode}?mode=${data.isFree ? "free" : "paid"}`);
      }
    } catch (error) {
      console.error("Error joining room:", error);
    } finally {
      setIsJoining(false);
    }
  };

  if (mode === "select") {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="btn btn-sm btn-ghost">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-glow-primary ml-2">Multiplayer</h1>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setMode("free")}
            className="w-full bg-card/50 backdrop-blur border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-200"
          >
            <h2 className="text-xl font-bold mb-2">Free Mode</h2>
            <p className="text-sm text-base-content/60">Play with friends, no stakes</p>
          </button>

          <button
            onClick={() => setMode("paid")}
            className="w-full bg-card/50 backdrop-blur border border-border rounded-xl p-6 hover:border-secondary/50 transition-all duration-200"
          >
            <h2 className="text-xl font-bold mb-2">Paid Mode</h2>
            <p className="text-sm text-base-content/60">Stake CELO, winner takes all</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 pb-24">
      <div className="flex items-center mb-6">
        <button onClick={() => setMode("select")} className="btn btn-sm btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-glow-primary ml-2">{mode === "free" ? "Free Mode" : "Paid Mode"}</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-card/50 backdrop-blur border border-primary/20 rounded-xl p-6">
          <h2 className="flex items-center space-x-2 text-lg font-semibold mb-4">
            <Plus size={20} />
            <span>Create Room</span>
          </h2>
          <div className="space-y-4">
            {mode === "paid" && (
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
            )}
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
                onChange={e => {
                  const code = e.target.value.toUpperCase();
                  setRoomCode(code);
                  checkRoom(code);
                }}
                className="input input-bordered w-full text-center text-lg font-mono"
                placeholder="XXXXXX"
                maxLength={6}
              />
              {roomBetAmount && mode === "paid" && (
                <p className="text-sm text-primary mt-2 font-semibold">Bet Amount: {roomBetAmount} CELO</p>
              )}
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
