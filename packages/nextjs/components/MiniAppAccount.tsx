"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Copy, Network } from "lucide-react";
import toast from "react-hot-toast";
import { useAccount, useBalance, useEnsName, useSwitchChain } from "wagmi";
import { base, celo } from "wagmi/chains";

interface MiniAppAccountProps {
  platform: "farcaster" | "base" | "minipay";
}

export function MiniAppAccount({ platform }: MiniAppAccountProps) {
  const { address, chain, isConnecting } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const { switchChain, isPending: switchPending } = useSwitchChain();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const platformColors = useMemo(() => {
    switch (platform) {
      case "farcaster":
        return "border-purple-500/30 bg-purple-500/10";
      case "base":
        return "border-blue-500/30 bg-blue-500/10";
      case "minipay":
        return "border-green-500/30 bg-green-500/10";
      default:
        return "border-primary/30 bg-primary/10";
    }
  }, [platform]);

  const displayName = useMemo(
    () => ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""),
    [ensName, address],
  );

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
      <div className={`rounded-xl p-4 border backdrop-blur ${platformColors}`}>
        <div className="flex items-center justify-center">
          {isConnecting ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <span className="text-sm text-base-content/60">Connecting...</span>
          )}
        </div>
      </div>
    );
  }

  const canSwitchNetworks = platform === "farcaster";

  return (
    <div className={`rounded-xl p-4 border backdrop-blur ${platformColors}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">{displayName}</p>
            <p className="text-xs text-base-content/60">
              {balanceLoading ? (
                <span className="loading loading-dots loading-xs"></span>
              ) : (
                `${balance?.formatted.slice(0, 6)} ${balance?.symbol}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSwitchNetworks && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="btn btn-xs btn-ghost flex items-center gap-1"
                disabled={switchPending}
              >
                {switchPending ? <span className="loading loading-spinner loading-xs"></span> : <Network size={12} />}
                <span className="text-xs">{chain?.name}</span>
                <ChevronDown size={10} />
              </button>

              {showNetworkMenu && (
                <div className="absolute right-0 top-8 bg-base-100 border border-border rounded-lg shadow-lg z-50 min-w-32">
                  <button
                    onClick={() => handleNetworkSwitch(celo.id)}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-base-200 first:rounded-t-lg ${
                      chain?.id === celo.id ? "bg-primary/10 text-primary" : ""
                    }`}
                    disabled={chain?.id === celo.id}
                  >
                    Celo {chain?.id === celo.id && "✓"}
                  </button>
                  <button
                    onClick={() => handleNetworkSwitch(base.id)}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-base-200 last:rounded-b-lg ${
                      chain?.id === base.id ? "bg-primary/10 text-primary" : ""
                    }`}
                    disabled={chain?.id === base.id}
                  >
                    Base {chain?.id === base.id && "✓"}
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={handleCopyAddress} className="btn btn-xs btn-ghost" title="Copy address">
            <Copy size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
