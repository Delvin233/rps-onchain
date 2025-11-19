"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Copy, Network } from "lucide-react";
import toast from "react-hot-toast";
import { useAccount, useBalance, useEnsName, useSwitchChain } from "wagmi";
import { base, celo } from "wagmi/chains";
import { useFarcaster } from "~~/contexts/FarcasterContext";

interface MiniAppAccountProps {
  platform: "farcaster" | "base" | "minipay";
}

export function MiniAppAccount({ platform }: MiniAppAccountProps) {
  const { address, chain, isConnecting } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const { switchChain, isPending: switchPending } = useSwitchChain();
  const { enrichedUser } = useFarcaster();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const platformColors = useMemo(() => {
    switch (platform) {
      case "farcaster":
        return "border-accent/30 bg-accent/10";
      case "base":
        return "border-secondary/30 bg-secondary/10";
      case "minipay":
        return "border-primary/30 bg-primary/10";
      default:
        return "border-primary/30 bg-primary/10";
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

    // Base app: basename > farcaster profile > truncated wallet
    if (platform === "base") {
      // 1. Basename (ENS ending in .base)
      if (ensName && (ensName.endsWith(".base.eth") || ensName.endsWith(".base"))) {
        return {
          displayName: ensName,
          avatarUrl: null, // TODO: Add basename avatar resolution
        };
      }

      // 2. Farcaster profile (if available)
      if (enrichedUser) {
        return {
          displayName: enrichedUser.username ? `@${enrichedUser.username}` : enrichedUser.displayName,
          avatarUrl: enrichedUser.pfpUrl,
        };
      }

      // 3. Truncated wallet address
      return {
        displayName: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "",
        avatarUrl: null,
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
  }, [platform, enrichedUser, ensName, address]);

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
      await navigator.clipboard.writeText(address);
      toast.success("Address copied!", { duration: 2000, style: toastStyle });
    } catch {
      toast.error("Failed to copy address");
    }
  }, [address, toastStyle]);

  const handleNetworkSwitch = useCallback(
    async (chainId: number) => {
      try {
        await switchChain({ chainId });
        setShowNetworkMenu(false);
        toast.success(`Switched to ${chainId === celo.id ? "Celo" : "Base"}`, {
          duration: 2000,
          style: toastStyle,
        });
      } catch {
        toast.error("Failed to switch network");
        setShowNetworkMenu(false);
      }
    },
    [switchChain, toastStyle],
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

  if (!address) {
    return (
      <div
        className={`rounded-xl border backdrop-blur ${platformColors}`}
        style={{ padding: "var(--card-padding, 1rem)" }}
      >
        <div className="flex items-center justify-center">
          {isConnecting ? (
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
      className={`rounded-xl border backdrop-blur ${platformColors}`}
      style={{ padding: "var(--card-padding, 1rem)" }}
    >
      <div className="flex items-center justify-between" style={{ gap: "var(--inner-gap, 0.75rem)" }}>
        <div className="flex items-center" style={{ gap: "var(--inner-gap, 0.75rem)" }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              onError={e => {
                // Fallback to text avatar on image error
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold ${avatarUrl ? "hidden" : ""}`}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p
              className="font-semibold text-base-content"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "calc(0.875rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
              }}
            >
              {displayName}
            </p>
            <p
              className="text-base-content/60"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "calc(0.75rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
              }}
            >
              {balanceLoading ? (
                <span className="loading loading-dots loading-xs"></span>
              ) : (
                `${balance?.formatted.slice(0, 6)} ${balance?.symbol}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: "var(--inner-gap, 0.5rem)" }}>
          {canSwitchNetworks && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="btn btn-xs btn-ghost flex items-center"
                style={{
                  gap: "var(--inner-gap, 0.25rem)",
                  fontFamily: "var(--font-body)",
                  fontSize: "calc(0.75rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
                }}
                disabled={switchPending}
              >
                {switchPending ? <span className="loading loading-spinner loading-xs"></span> : <Network size={12} />}
                <span>{chain?.name}</span>
                <ChevronDown size={10} />
              </button>

              {showNetworkMenu && (
                <div className="absolute right-0 top-8 bg-base-100 border border-border rounded-lg shadow-lg z-50 min-w-32">
                  <button
                    onClick={() => handleNetworkSwitch(celo.id)}
                    className={`w-full text-left hover:bg-base-200 first:rounded-t-lg ${
                      chain?.id === celo.id ? "bg-primary/10 text-primary" : ""
                    }`}
                    style={{
                      padding: "var(--inner-gap, 0.5rem) var(--inner-gap, 0.75rem)",
                      fontFamily: "var(--font-body)",
                      fontSize: "calc(0.75rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
                    }}
                    disabled={chain?.id === celo.id}
                  >
                    Celo {chain?.id === celo.id && "✓"}
                  </button>
                  <button
                    onClick={() => handleNetworkSwitch(base.id)}
                    className={`w-full text-left hover:bg-base-200 last:rounded-b-lg ${
                      chain?.id === base.id ? "bg-primary/10 text-primary" : ""
                    }`}
                    style={{
                      padding: "var(--inner-gap, 0.5rem) var(--inner-gap, 0.75rem)",
                      fontFamily: "var(--font-body)",
                      fontSize: "calc(0.75rem * var(--font-size-multiplier, 1) * var(--font-size-override, 1))",
                    }}
                    disabled={chain?.id === base.id}
                  >
                    Base {chain?.id === base.id && "✓"}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCopyAddress}
            className="btn btn-xs btn-ghost"
            title="Copy address"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <Copy size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
