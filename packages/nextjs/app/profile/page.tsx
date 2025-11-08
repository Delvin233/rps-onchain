"use client";

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Copy, Shield, LogOut } from "lucide-react";
import { useAuth } from "~~/contexts/AuthContext";
import { SelfVerificationModal } from "~~/components/SelfVerificationModal";

export default function ProfilePage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { isHumanVerified } = useAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [username, setUsername] = useState("");

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const maxBet = isHumanVerified ? 1000 : 20;

  if (!address) {
    return (
      <div className="flex items-center justify-center p-6 py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
          <p className="text-base-content/60 mb-6">Connect your wallet to view your profile</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-200 p-6 pt-12 pb-24">
      <h1 className="text-3xl font-bold text-glow-primary mb-6">Profile</h1>

      {/* Wallet Info */}
      <div className="card-gaming p-6 mb-4">
        <p className="text-sm text-base-content/60 mb-2">Wallet Address</p>
        <div className="flex items-center justify-between">
          <code className="text-sm font-mono">{address.slice(0, 10)}...{address.slice(-8)}</code>
          <button onClick={copyAddress} className="btn btn-sm btn-ghost">
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Username */}
      <div className="card-gaming p-6 mb-4">
        <label className="text-sm text-base-content/60 mb-2 block">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter username"
          className="input input-bordered w-full"
        />
      </div>

      {/* Verification Status */}
      <div className={`card-gaming p-6 mb-4 ${isHumanVerified ? "border-success/50" : "border-warning/50"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className={isHumanVerified ? "text-success" : "text-warning"} size={24} />
            <div>
              <p className="font-semibold">{isHumanVerified ? "Verified Account" : "Unverified Account"}</p>
              <p className="text-xs text-base-content/60">Max bet: {maxBet} CELO</p>
            </div>
          </div>
        </div>
        {!isHumanVerified && (
          <button onClick={() => setShowVerificationModal(true)} className="btn btn-primary w-full">
            Verify Identity
          </button>
        )}
      </div>

      {/* Disconnect */}
      <button onClick={() => disconnect()} className="btn btn-error w-full">
        <LogOut size={16} />
        Disconnect Wallet
      </button>

      <SelfVerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} />
    </div>
  );
}
