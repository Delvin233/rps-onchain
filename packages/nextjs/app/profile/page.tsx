"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { IoColorPalette } from "react-icons/io5";
import { MdLightbulbOutline } from "react-icons/md";
import { LoginButton } from "~~/components/LoginButton";
import { MiniAppAccount } from "~~/components/MiniAppAccount";
import { useAuth } from "~~/contexts/AuthContext";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { useGoodDollarClaim } from "~~/hooks/useGoodDollarClaim";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";

const SelfVerificationModal = lazy(() =>
  import("~~/components/SelfVerificationModal").then(mod => ({ default: mod.SelfVerificationModal })),
);

export default function ProfilePage() {
  const router = useRouter();
  const { address } = useConnectedAddress();
  const { isHumanVerified } = useAuth();
  const { isMiniApp, isBaseApp, isMiniPay, isFarcaster } = usePlatformDetection();

  useEffect(() => {
    if (!address && isMiniPay && typeof window !== "undefined") {
      const shown = sessionStorage.getItem("minipay_reconnect_toast");
      if (!shown) {
        sessionStorage.setItem("minipay_reconnect_toast", "true");
        toast("Navigate to Home to reconnect your wallet", {
          duration: 5000,
          style: {
            background: "var(--color-base-100)",
            color: "var(--color-base-content)",
            border: "1px solid var(--color-primary)",
          },
        });
      }
    }
    if (address && isMiniPay) {
      sessionStorage.removeItem("minipay_reconnect_toast");
    }
  }, [address, isMiniPay]);

  const getPlatform = (): "farcaster" | "base" | "minipay" => {
    if (isBaseApp) return "base";
    if (isMiniPay) return "minipay";
    if (isFarcaster) return "farcaster";
    return "farcaster";
  };
  const { displayName, hasEns, ensType, pfpUrl } = useDisplayName(address);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { checkEntitlement, getNextClaimTime, claim, isLoading, isReady, identitySDK } = useGoodDollarClaim(
    address || undefined,
  );
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
    const interval = setInterval(updateCountdown, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextClaimTime]);

  const handleClaim = async () => {
    try {
      await claim();
      toast.success("UBI claimed successfully!");
      try {
        const [newEntitlement, newNextClaimTime] = await Promise.all([checkEntitlement(), getNextClaimTime()]);
        setEntitlement(newEntitlement.amount);
        setNextClaimTime(newNextClaimTime);
      } catch (refreshError) {
        console.error("Error refreshing claim status:", refreshError);
        setTimeout(() => window.location.reload(), 2000);
      }
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

  const isMiniPayCheck = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;

  if (!address) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <h1
              className="font-bold mb-3 animate-glow"
              style={{
                fontSize: "calc(2.25rem * var(--font-size-override, 1))",
                color: "var(--color-primary)",
              }}
            >
              Profile
            </h1>
          </div>
          {isMiniPayCheck ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <LoginButton />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pt-4 lg:pt-0 pb-16 lg:pb-0">
      <h1
        className="font-bold mb-6"
        style={{
          fontSize: "calc(1.875rem * var(--font-size-override, 1))",
          color: "var(--color-primary)",
        }}
      >
        Profile
      </h1>

      {/* Mobile Wallet Button */}
      {isMiniApp ? (
        <div className="mb-4">
          <MiniAppAccount platform={getPlatform()} />
        </div>
      ) : (
        <div
          className="rounded-xl p-6 mb-4 lg:hidden"
          style={{
            background:
              "linear-gradient(to right, rgba(var(--color-primary-rgb, 16, 185, 129), 0.2), rgba(var(--color-secondary-rgb, 251, 146, 60), 0.2))",
            border: "1px solid rgba(var(--color-primary-rgb, 16, 185, 129), 0.3)",
          }}
        >
          <div className="flex items-center justify-center">
            <LoginButton size="sm" />
          </div>
        </div>
      )}

      {/* User Details - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Wallet Info */}
        <div className="rounded-xl p-6 bg-card/50 border border-border">
          <p
            className="text-base-content/60 mb-2"
            style={{ fontSize: "calc(0.875rem * var(--font-size-override, 1))" }}
          >
            Wallet Address
          </p>
          <div className="flex items-center justify-between">
            <code className="font-mono" style={{ fontSize: "calc(0.875rem * var(--font-size-override, 1))" }}>
              {address.slice(0, 10)}...{address.slice(-8)}
            </code>
            <button onClick={copyAddress} className="btn btn-sm btn-ghost">
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Display Name */}
        <div className="rounded-xl p-6 bg-card/50 border border-border">
          <p
            className="text-base-content/60 mb-2"
            style={{ fontSize: "calc(0.875rem * var(--font-size-override, 1))" }}
          >
            Display Name
          </p>
          <div className="flex items-center gap-3">
            {pfpUrl && (
              <Image
                src={pfpUrl}
                alt={displayName}
                width={40}
                height={40}
                className="rounded-full"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzMzIi8+PC9zdmc+"
                onError={e => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <p className="font-semibold" style={{ fontSize: "calc(1.125rem * var(--font-size-override, 1))" }}>
              {displayName}
              {hasEns && (
                <span
                  className={`text-xs ml-2 ${
                    ensType === "mainnet"
                      ? "text-success"
                      : ensType === "basename"
                        ? "text-primary"
                        : ensType === "farcaster"
                          ? "text-purple-500"
                          : "text-info"
                  }`}
                >
                  {ensType === "mainnet"
                    ? "ENS"
                    : ensType === "basename"
                      ? "BASENAME"
                      : ensType === "farcaster"
                        ? "FC"
                        : "BASE"}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-card/50 rounded-xl p-6 mb-4 border border-border">
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
            Verify Identity With Self
          </button>
        )}
      </div>

      {/* GoodDollar UBI Claim - HIGHLIGHTED */}
      <div className="bg-card/50 rounded-xl p-6 mb-4 border-2 border-primary">
        <div className="flex items-center space-x-3 mb-4">
          <span style={{ fontSize: "calc(1.5rem * var(--font-size-override, 1))" }}>💚</span>
          <div>
            <p className="font-semibold">Daily UBI Claim</p>
            <p className="text-xs text-base-content/60">Claim your GoodDollar (G$) tokens on CELO Network</p>
          </div>
        </div>

        {isReady ? (
          <>
            {entitlement > 0n ? (
              <>
                <div className="rounded-lg p-4 mb-4 bg-primary/10 border border-primary/30">
                  <p className="text-sm text-base-content/60 mb-1">Available to claim</p>
                  <p
                    className="font-bold"
                    style={{ fontSize: "calc(1.5rem * var(--font-size-override, 1))", color: "var(--color-primary)" }}
                  >
                    {(Number(entitlement) / 1e18).toFixed(2)} G$
                  </p>
                </div>
                {isWhitelisted === false && (
                  <div className="bg-info/10 border border-info/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-info flex items-center gap-2">
                      <MdLightbulbOutline size={16} />
                      First time? Clicking &quot;Claim Now&quot; will redirect you to complete Face Verification
                    </p>
                  </div>
                )}
                <button
                  onClick={handleClaim}
                  disabled={isLoading}
                  className="btn w-full"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-primary-content)",
                    borderColor: "var(--color-primary)",
                  }}
                >
                  {isLoading ? "Claiming..." : "Claim Now"}
                </button>
              </>
            ) : (
              <>
                <div className="bg-base-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-base-content/60 mb-1">Next claim available in</p>
                  <p className="font-bold" style={{ fontSize: "calc(1.25rem * var(--font-size-override, 1))" }}>
                    {timeUntilClaim || "Checking..."}
                  </p>
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

      {/* Theme Settings Link */}
      <button
        onClick={() => router.push("/theme-settings")}
        className="rounded-xl p-4 w-full text-left transition-all mt-4 bg-card/50 border border-border hover:border-primary/50"
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

      {showVerificationModal && (
        <Suspense fallback={null}>
          <SelfVerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} />
        </Suspense>
      )}
    </div>
  );
}
