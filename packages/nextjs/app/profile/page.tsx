"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Copy, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { IoColorPalette } from "react-icons/io5";
import { useAccount } from "wagmi";
import { SelfVerificationModal } from "~~/components/SelfVerificationModal";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useAuth } from "~~/contexts/AuthContext";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { useGoodDollarClaim } from "~~/hooks/useGoodDollarClaim";

export default function ProfilePage() {
  const router = useRouter();
  const { address } = useAccount();
  const { isHumanVerified } = useAuth();
  const { displayName, hasEns, ensType } = useDisplayName(address);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { checkEntitlement, getNextClaimTime, claim, isLoading, isReady, identitySDK } = useGoodDollarClaim();
  const [entitlement, setEntitlement] = useState<bigint>(0n);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [timeUntilClaim, setTimeUntilClaim] = useState("");
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);

  useEffect(() => {
    if (isReady && address && identitySDK) {
      checkEntitlement().then(result => setEntitlement(result.amount));
      getNextClaimTime().then(setNextClaimTime);
      identitySDK.getWhitelistedRoot(address).then(({ isWhitelisted }) => {
        setIsWhitelisted(isWhitelisted);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, address]);

  useEffect(() => {
    if (!nextClaimTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextClaimTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilClaim("Available now!");
        checkEntitlement().then(result => setEntitlement(result.amount));
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilClaim(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextClaimTime]);

  const handleClaim = async () => {
    try {
      await claim();
      toast.success("UBI claimed successfully!");
      checkEntitlement().then(result => setEntitlement(result.amount));
      getNextClaimTime().then(setNextClaimTime);
    } catch (error) {
      console.error("Claim error:", error);
      toast.error("Failed to claim UBI");
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
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
    <div className="min-h-screen bg-base-200 pt-4 lg:pt-0 pb-16 lg:pb-0">
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
              <p className="text-xs text-base-content/60">
                {isHumanVerified ? "Verified human player" : "Verify to prove you're human"}
              </p>
            </div>
          </div>
        </div>
        {!isHumanVerified && (
          <button onClick={() => setShowVerificationModal(true)} className="btn btn-primary w-full">
            Verify Identity
          </button>
        )}
      </div>

      {/* Theme Settings Link */}
      <button
        onClick={() => router.push("/theme-settings")}
        className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 w-full text-left hover:border-primary/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IoColorPalette className="text-primary" size={28} />
            <div>
              <p className="font-semibold">Theme Settings</p>
              <p className="text-xs text-base-content/60">Customize fonts, spacing & colors</p>
            </div>
          </div>
          <span className="text-base-content/60">→</span>
        </div>
      </button>

      {/* GoodDollar UBI Claim */}
      <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 mt-4">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">💚</span>
          <div>
            <p className="font-semibold">Daily UBI Claim</p>
            <p className="text-xs text-base-content/60">Claim your GoodDollar (G$) tokens</p>
          </div>
        </div>

        {isReady ? (
          <>
            {entitlement > 0n ? (
              <>
                <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-base-content/60 mb-1">Available to claim</p>
                  <p className="text-2xl font-bold text-success">{(Number(entitlement) / 1e18).toFixed(2)} G$</p>
                </div>
                {isWhitelisted === false && (
                  <div className="bg-info/10 border border-info/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-info">
                      💡 First time? Clicking &quot;Claim Now&quot; will redirect you to complete Face Verification
                    </p>
                  </div>
                )}
                <button onClick={handleClaim} disabled={isLoading} className="btn btn-success w-full">
                  {isLoading ? "Claiming..." : "Claim Now"}
                </button>
              </>
            ) : (
              <>
                <div className="bg-base-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-base-content/60 mb-1">Next claim available in</p>
                  <p className="text-xl font-bold">{timeUntilClaim || "Checking..."}</p>
                </div>
                <button disabled className="btn btn-disabled w-full">
                  Claim Unavailable
                </button>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-base-content/60">Loading claim status...</p>
          </div>
        )}
      </div>

      <SelfVerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} />
    </div>
  );
}
