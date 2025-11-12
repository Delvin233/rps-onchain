"use client";

import { useState } from "react";
import { Address, formatEther } from "viem";
import { base, celo } from "viem/chains";
import { useBalance, useChainId } from "wagmi";

type BalanceDisplayProps = {
  address?: Address;
  format?: "compact" | "full";
};

export const BalanceDisplay = ({ address, format = "compact" }: BalanceDisplayProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const chainId = useChainId();
  const { data: balance, isLoading } = useBalance({ address, chainId });

  if (!address || isLoading || !balance) {
    return null;
  }

  const formattedBalance = Number(formatEther(balance.value));
  const nativeSymbol = chainId === celo.id ? "CELO" : chainId === base.id ? "ETH" : balance.symbol;

  if (format === "full") {
    return (
      <button
        onClick={() => setIsHidden(!isHidden)}
        className="bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap"
        type="button"
      >
        <span className="text-xs text-base-content/60">Bal:</span>
        <span className="text-sm font-bold">
          {isHidden ? "****" : `${formattedBalance.toFixed(4)} ${nativeSymbol}`}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setIsHidden(!isHidden)}
      className="bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg px-2 py-1 transition-all"
      type="button"
    >
      <span className="text-sm font-bold">{isHidden ? "****" : `${formattedBalance.toFixed(4)} ${nativeSymbol}`}</span>
    </button>
  );
};
