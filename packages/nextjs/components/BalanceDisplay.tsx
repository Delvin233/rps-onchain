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
  const balanceText = isHidden ? "****" : `${formattedBalance.toFixed(4)} ${nativeSymbol}`;

  return (
    <button
      onClick={() => setIsHidden(!isHidden)}
      className={`${isUnsupportedChain ? "bg-error/10 border-error/30" : "bg-primary/10 border-primary/30"} hover:opacity-80 border rounded-lg px-3 py-1.5 transition-all ${format === "full" ? "flex items-center gap-1.5 whitespace-nowrap" : ""}`}
      type="button"
      title={isUnsupportedChain ? "Unsupported network. Switch to Celo or Base" : ""}
    >
      {format === "full" && (
        <span style={{ fontSize: "0.75rem" }} className="text-base-content/60">
          {isUnsupportedChain ? "⚠️" : "Bal:"}
        </span>
      )}
      <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
        {format === "compact" && isUnsupportedChain && "⚠️ "}
        {balanceText}
      </span>
    </button>
  );
});

BalanceDisplay.displayName = "BalanceDisplay";
