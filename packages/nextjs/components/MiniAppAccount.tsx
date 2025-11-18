"use client";

import { useState } from "react";
import { ChevronDown, Copy, Network } from "lucide-react";
import { useAccount, useBalance, useEnsName, useSwitchChain } from "wagmi";
import { base, celo } from "wagmi/chains";

interface MiniAppAccountProps {
  platform: "farcaster" | "base" | "minipay";
}

export function MiniAppAccount({ platform }: MiniAppAccountProps) {
  const { address, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const { switchChain } = useSwitchChain();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);

  if (!address) return null;

  const displayName = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`;
  const canSwitchNetworks = platform === "farcaster";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  const handleNetworkSwitch = (chainId: number) => {
    switchChain({ chainId });
    setShowNetworkMenu(false);
  };

  const getPlatformColors = () => {
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
  };

  return (
    <div className={`rounded-xl p-4 border backdrop-blur ${getPlatformColors()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">{displayName}</p>
            <p className="text-xs text-base-content/60">
              {balance?.formatted.slice(0, 6)} {balance?.symbol}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSwitchNetworks && (
            <div className="relative">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="btn btn-xs btn-ghost flex items-center gap-1"
              >
                <Network size={12} />
                <span className="text-xs">{chain?.name}</span>
                <ChevronDown size={10} />
              </button>

              {showNetworkMenu && (
                <div className="absolute right-0 top-8 bg-base-100 border border-border rounded-lg shadow-lg z-50 min-w-32">
                  <button
                    onClick={() => handleNetworkSwitch(celo.id)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-base-200 first:rounded-t-lg"
                  >
                    Celo
                  </button>
                  <button
                    onClick={() => handleNetworkSwitch(base.id)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-base-200 last:rounded-b-lg"
                  >
                    Base
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
