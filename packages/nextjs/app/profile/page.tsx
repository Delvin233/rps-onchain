"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Copy, LogOut, Shield, Wallet } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { BalanceDisplay } from "~~/components/BalanceDisplay";
import { SelfVerificationModal } from "~~/components/SelfVerificationModal";
import { useAuth } from "~~/contexts/AuthContext";

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
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-glow-primary mb-3 animate-glow">Profile</h1>
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
    <div className="min-h-screen bg-base-200 p-6 pt-12 pb-24">
      <h1 className="text-3xl font-bold text-glow-primary mb-6">Profile</h1>

      {/* Balance */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <Wallet className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-base-content/60">Balance</p>
              <div className="text-2xl font-bold">
                <BalanceDisplay address={address} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 mb-4">
        <p className="text-sm text-base-content/60 mb-2">Wallet Address</p>
        <div className="flex items-center justify-between">
          <code className="text-sm font-mono">
            {address.slice(0, 10)}...{address.slice(-8)}
          </code>
          <button onClick={copyAddress} className="btn btn-sm btn-ghost">
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Username */}
      <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 mb-4">
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
      <div
        className={`bg-card/50 backdrop-blur border rounded-xl p-6 mb-4 ${isHumanVerified ? "border-success/50" : "border-warning/50"}`}
      >
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
