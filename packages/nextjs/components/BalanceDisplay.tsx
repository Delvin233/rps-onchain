"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Address, formatEther } from "viem";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

type BalanceDisplayProps = {
  address?: Address;
};

export const BalanceDisplay = ({ address }: BalanceDisplayProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const { data: balance, isLoading } = useWatchBalance({ address });

  if (!address || isLoading || balance === null) {
    return null;
  }

  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  return (
    <div className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg px-3 py-1.5 transition-all">
      <Link href="/profile" className="flex items-center gap-2">
        <span className="text-xs text-base-content/60">Balance:</span>
        <span className="text-sm font-bold">
          {isHidden ? "****" : formattedBalance.toFixed(4)} {!isHidden && targetNetwork.nativeCurrency.symbol}
        </span>
      </Link>
      <button
        onClick={() => setIsHidden(!isHidden)}
        className="p-1 hover:bg-primary/20 rounded transition-all"
        type="button"
      >
        {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </div>
  );
};
