"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Copy, Shield } from "lucide-react";
import { useAccount } from "wagmi";
import { SelfVerificationModal } from "~~/components/SelfVerificationModal";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useAuth } from "~~/contexts/AuthContext";
import { useDisplayName } from "~~/hooks/useDisplayName";

export default function ProfilePage() {
  const { address } = useAccount();
  const { isHumanVerified } = useAuth();
  const { displayName, hasEns, ensType } = useDisplayName(address);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

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

      {/* Wallet */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-center">
          <RainbowKitCustomConnectButton />
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

      {/* Display Name */}
      <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 mb-4">
        <p className="text-sm text-base-content/60 mb-2">Display Name</p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">
            {displayName}
            {hasEns && (
              <span
                className={`text-xs ml-2 ${
                  ensType === "mainnet" ? "text-success" : ensType === "basename" ? "text-primary" : "text-info"
                }`}
              >
                {ensType === "mainnet" ? "ENS" : ensType === "basename" ? "BASENAME" : "BASE"}
              </span>
            )}
          </p>
        </div>
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
              <p className="text-xs text-base-content/60">Verified human player</p>
            </div>
          </div>
        </div>
        {!isHumanVerified && (
          <button onClick={() => setShowVerificationModal(true)} className="btn btn-primary w-full">
            Verify Identity
          </button>
        )}
      </div>

      <SelfVerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} />
    </div>
  );
}
