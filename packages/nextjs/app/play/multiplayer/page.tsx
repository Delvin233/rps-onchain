"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Users } from "lucide-react";

export default function MultiplayerPage() {
  const router = useRouter();
  const [betAmount, setBetAmount] = useState("0.01");

  return (
    <div className="p-6 pt-12 pb-24">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="btn btn-sm btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-glow-primary ml-2">Multiplayer</h1>
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
                step={0.01}
                className="input input-bordered w-full"
              />
            </div>
            <button className="btn btn-primary w-full">Create Room</button>
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
              <input className="input input-bordered w-full text-center text-lg font-mono" placeholder="XXXXXX" maxLength={6} />
            </div>
            <button className="btn btn-secondary w-full">Join Game</button>
          </div>
        </div>
      </div>
    </div>
  );
}
