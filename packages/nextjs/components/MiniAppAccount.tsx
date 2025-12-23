"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Copy, Network } from "lucide-react";
import toast from "react-hot-toast";
import { MdLocalGasStation } from "react-icons/md";
import { useBalance, useEnsName, useSwitchChain } from "wagmi";
import { base, celo } from "wagmi/chains";
import { useAuth } from "~~/contexts/AuthContext";
import { useFarcaster } from "~~/contexts/FarcasterContext";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { useSafeAccount } from "~~/hooks/useSafeAccount";

interface MiniAppAccountProps {
  platform: "farcaster" | "base" | "minipay";
}

export function MiniAppAccount({ platform }: MiniAppAccountProps) {
  const { address: authAddress, authMethod } = useAuth();
  const { address: wagmiAddress, chain, isConnecting } = useSafeAccount();
  // Use auth address (which includes Farcaster) or fall back to wagmi address
  const address = authAddress || wagmiAddress;

  // State-based chain selection for Farcaster users (no wallet connection)
  const [farcasterChainId, setFarcasterChainId] = useState<number>(celo.id);

  // Default to Celo for Farcaster users (no wallet connection)
  const activeChain = chain || (authMethod === "farcaster" ? (farcasterChainId === base.id ? base : celo) : undefined);
  const cUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`;
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    token: platform === "minipay" ? cUSD_ADDRESS : undefined,
    chainId: activeChain?.id, // Explicitly specify chain for Farcaster users
  });
  const { data: ensName } = useEnsName({ address: address as `0x${string}` | undefined });
  const { switchChain, isPending: switchPending } = useSwitchChain();
  const { enrichedUser, isMiniAppReady } = useFarcaster();
  const { displayName: apiDisplayName, pfpUrl: apiPfpUrl, ensType } = useDisplayName(address);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const platformBorderColor = useMemo(() => {
    switch (platform) {
      case "farcaster":
        return "#a855f7"; // Purple (Farcaster brand color)
      case "base":
        return "var(--color-secondary)"; // Blue/Teal
      case "minipay":
        return "var(--color-primary)"; // Green
      default:
        return "var(--color-primary)";
    }
  }, [platform]);

  const { displayName, avatarUrl } = useMemo(() => {
    // Farcaster: @username + pfp
    if (platform === "farcaster" && enrichedUser) {
      return {
        displayName: enrichedUser.username ? `@${enrichedUser.username}` : enrichedUser.displayName,
        avatarUrl: enrichedUser.pfpUrl,
      };
    }

    // Base app: Use API-based resolution (basename > farcaster > wallet)
    if (platform === "base") {
      return {
        displayName: apiDisplayName,
        avatarUrl: apiPfpUrl || null,
      };
    }

    // MiniPay: minipay profile > wallet address
    if (platform === "minipay") {
      // TODO: Add MiniPay profile data when API becomes available
      // if (miniPayProfile) {
      //   return {
      //     displayName: miniPayProfile.name,
      //     avatarUrl: miniPayProfile.avatar
      //   };
      // }

      // Fallback to wallet address
      return {
        displayName: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "",
        avatarUrl: null,
      };
    }

    // Default fallback
    return {
      displayName: ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""),
      avatarUrl: null,
    };
  }, [platform, enrichedUser, ensName, address, apiDisplayName, apiPfpUrl]);

  const toastStyle = useMemo(
    () => ({
      background: "var(--color-base-100)",
      color: "var(--color-base-content)",
      border: "1px solid var(--color-success)",
    }),
    [],
  );

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(address);
      toast.success("Address copied!", { duration: 2000, style: toastStyle });
    } catch {
      // Fallback for iframes (Base app preview)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = address;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast.success("Address copied!", { duration: 2000, style: toastStyle });
      } catch {
        toast.error("Failed to copy address");
      }
    }
  }, [address, toastStyle]);

  const handleNetworkSwitch = useCallback(
    async (chainId: number) => {
      try {
        // For Farcaster users without wallet connection, use state-based switching
        if (authMethod === "farcaster" && !chain) {
          setFarcasterChainId(chainId);
          setShowNetworkMenu(false);
          toast.success(`Switched to ${chainId === celo.id ? "Celo" : "Base"}`, {
            duration: 2000,
            style: toastStyle,
          });
        } else {
          // For wallet users, use wagmi's switchChain
          await switchChain({ chainId });
          setShowNetworkMenu(false);
          toast.success(`Switched to ${chainId === celo.id ? "Celo" : "Base"}`, {
            duration: 2000,
            style: toastStyle,
          });
        }
      } catch {
        toast.error("Failed to switch network");
        setShowNetworkMenu(false);
      }
    },
    [authMethod, chain, switchChain, toastStyle],
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNetworkMenu(false);
      }
    };

    if (showNetworkMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNetworkMenu]);

  // Show loading state while waiting for address
  const isLoading = !address && (isConnecting || (platform === "farcaster" && !isMiniAppReady));

  if (!address) {
    return (
      <div
        className="rounded-xl border bg-card/50"
        style={{
          padding: "var(--card-padding, 1rem)",
          borderColor: platformBorderColor,
        }}
      >
        <div className="flex items-center justify-center">
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <span
              className="text-base-content/60"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "calc(0.875rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
              }}
            >
              Connecting...
            </span>
          )}
        </div>
      </div>
    );
  }

  const canSwitchNetworks = platform === "farcaster";

  return (
    <div
      className="rounded-xl border relative bg-card/50"
      style={{
        padding: "var(--card-padding, 1rem)",
        borderColor: platformBorderColor,
        zIndex: showNetworkMenu ? 9999 : 10,
        overflow: showNetworkMenu ? "visible" : "hidden",
      }}
    >
      {/* Row 1: Avatar + Username + Actions */}
      <div className="flex items-center justify-between" style={{ gap: "var(--inner-gap, 0.75rem)" }}>
        <div className="flex items-center min-w-0 flex-1" style={{ gap: "var(--inner-gap, 0.75rem)" }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              onError={e => {
                // Fallback to text avatar on image error
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0 ${avatarUrl ? "hidden" : ""}`}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p
              className="font-semibold text-base-content flex items-center gap-1"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "calc(0.875rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
              }}
            >
              <span
                className="overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ maxWidth: "100%" }}
                title={displayName}
              >
                {displayName}
              </span>
              {ensType && (
                <span
                  className={`text-xs flex-shrink-0 ${
                    ensType === "ens"
                      ? "text-success"
                      : ensType === "basename"
                        ? "text-primary"
                        : ensType === "farcaster"
                          ? "text-purple-500"
                          : "text-info"
                  }`}
                  style={{
                    fontSize: "calc(0.65rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
                  }}
                >
                  {ensType === "ens"
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

        <div className="flex items-center flex-shrink-0" style={{ gap: "0.25rem" }}>
          <button
            onClick={handleCopyAddress}
            className="btn btn-xs btn-ghost p-1 min-h-0 h-auto"
            title="Copy address"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <Copy size={14} />
          </button>

          {canSwitchNetworks && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="btn btn-xs btn-ghost flex items-center p-1 min-h-0 h-auto"
                style={{
                  gap: "0.25rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "calc(0.75rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
                }}
                disabled={switchPending}
              >
                {switchPending ? <span className="loading loading-spinner loading-xs"></span> : <Network size={14} />}
                <span className="whitespace-nowrap">{activeChain?.name}</span>
                <ChevronDown size={10} />
              </button>

              {showNetworkMenu && (
                <div
                  className="absolute right-0 top-8 bg-base-100 border border-border rounded-lg shadow-lg min-w-32"
                  style={{ zIndex: 9999 }}
                >
                  <button
                    onClick={() => handleNetworkSwitch(celo.id)}
                    className={`w-full text-left hover:bg-base-200 first:rounded-t-lg ${
                      activeChain?.id === celo.id ? "bg-primary/10 text-primary" : ""
                    }`}
                    style={{
                      padding: "var(--inner-gap, 0.5rem) var(--inner-gap, 0.75rem)",
                      fontFamily: "var(--font-body)",
                      fontSize: "calc(0.75rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
                    }}
                    disabled={activeChain?.id === celo.id}
                  >
                    Celo {activeChain?.id === celo.id && "✓"}
                  </button>
                  <button
                    onClick={() => handleNetworkSwitch(base.id)}
                    className={`w-full text-left hover:bg-base-200 last:rounded-b-lg ${
                      activeChain?.id === base.id ? "bg-primary/10 text-primary" : ""
                    }`}
                    style={{
                      padding: "var(--inner-gap, 0.5rem) var(--inner-gap, 0.75rem)",
                      fontFamily: "var(--font-body)",
                      fontSize: "calc(0.75rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
                    }}
                    disabled={activeChain?.id === base.id}
                  >
                    Base {activeChain?.id === base.id && "✓"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Balance + Network Badge */}
      <div
        className="flex items-center gap-2 flex-wrap"
        style={{ marginTop: "var(--inner-gap, 0.5rem)", marginLeft: "calc(40px + var(--inner-gap, 0.75rem))" }}
      >
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="text-base-content/60 hover:text-base-content transition-colors cursor-pointer"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "calc(0.75rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          {balanceLoading ? (
            <span className="loading loading-dots loading-xs"></span>
          ) : showBalance ? (
            `${balance?.formatted.slice(0, 6)} ${balance?.symbol}`
          ) : (
            "••••••"
          )}
        </button>
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "calc(0.65rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
            }}
          >
            {activeChain?.name?.toUpperCase() || "CELO"}
          </span>
          {platform === "minipay" && (
            <span
              className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning flex items-center gap-0.5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "calc(0.6rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
              }}
              title="Network fees paid in cUSD"
            >
              <MdLocalGasStation size={10} /> cUSD
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
