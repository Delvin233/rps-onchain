"use client";

import { memo, useState } from "react";
import { Address, formatEther } from "viem";
import { useBalance, useChainId, useChains } from "wagmi";

type BalanceDisplayProps = {
  address?: Address;
  format?: "compact" | "full";
};

export const BalanceDisplay = memo(({ address, format = "compact" }: BalanceDisplayProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const chainId = useChainId();
  const chains = useChains();
  const { data: balance, isLoading } = useBalance({ address, chainId });
  const currentChain = chains.find(c => c.id === chainId);
  const isUnsupportedChain = !currentChain;

  if (!address || isLoading || !balance) {
    return null;
  }

  const formattedBalance = Number(formatEther(balance.value));
  const nativeSymbol = currentChain?.nativeCurrency?.symbol || balance.symbol;

  if (format === "full") {
    return (
      <button
        onClick={() => setIsHidden(!isHidden)}
        className={`${isUnsupportedChain ? "bg-error/10 border-error/30" : "bg-primary/10 border-primary/30"} hover:opacity-80 border rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap`}
        type="button"
        title={isUnsupportedChain ? "Unsupported network. Switch to Celo or Base" : ""}
      >
        <span className="text-xs text-base-content/60">{isUnsupportedChain ? "⚠️" : "Bal:"}</span>
        <span className="text-sm font-bold">
          {isHidden ? "****" : `${formattedBalance.toFixed(4)} ${nativeSymbol}`}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setIsHidden(!isHidden)}
      className={`${isUnsupportedChain ? "bg-error/10 border-error/30" : "bg-primary/10 border-primary/30"} hover:opacity-80 border rounded-lg px-2 py-1 transition-all`}
      type="button"
      title={isUnsupportedChain ? "Unsupported network. Switch to Celo or Base" : ""}
    >
      <span className="text-sm font-bold">
        {isUnsupportedChain && "⚠️ "}
        {isHidden ? "****" : `${formattedBalance.toFixed(4)} ${nativeSymbol}`}
      </span>
    </button>
  );
});

BalanceDisplay.displayName = "BalanceDisplay";
