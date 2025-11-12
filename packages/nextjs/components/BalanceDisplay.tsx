"use client";

import { useState } from "react";
import { Address, formatEther } from "viem";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

type BalanceDisplayProps = {
  address?: Address;
  format?: "compact" | "full";
};

export const BalanceDisplay = ({ address, format = "compact" }: BalanceDisplayProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const { data: balance, isLoading } = useWatchBalance({ address });

  if (!address || isLoading || balance === null) {
    return null;
  }

  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  if (format === "full") {
    return (
      <button
        onClick={() => setIsHidden(!isHidden)}
        className="bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap"
        type="button"
      >
        <span className="text-xs text-base-content/60">Bal:</span>
        <span className="text-sm font-bold">
          {isHidden ? "****" : `${formattedBalance.toFixed(2)} ${targetNetwork.nativeCurrency.symbol}`}
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
      <span className="text-sm font-bold">
        {isHidden ? "****" : `${formattedBalance.toFixed(2)} ${targetNetwork.nativeCurrency.symbol}`}
      </span>
    </button>
  );
};
